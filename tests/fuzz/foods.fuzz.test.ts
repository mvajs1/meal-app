import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';

const BASE_URL = 'http://localhost:3737';
const SEED = 20260620;
const NUM_RUNS = 100;
const DATABASE_PATH = resolve(process.cwd(), 'prisma/dev.db');
const FUZZ_PREFIX = `fuzz-atomicity-${SEED}-`;

type Payload = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  ingredients: string | string[];
  allergens: string[];
  category?: string;
};

type DatabaseSnapshot = {
  foods: unknown[];
  ingredients: unknown[];
  allergens: unknown[];
  foodIngredients: unknown[];
  foodAllergens: unknown[];
};

let sessionCookie = '';
let existingFoodNames: string[] = [];
let propertyInvocations = 0;
let finalFailure:
  | {
      payload: Payload;
      responseStatus: number;
      responseBody: unknown;
      leaked: ReturnType<typeof addedRows>;
    }
  | undefined;

function openDatabase() {
  return new Database(DATABASE_PATH);
}

function snapshotDatabase(): DatabaseSnapshot {
  const db = openDatabase();
  try {
    return {
      foods: db.prepare('SELECT * FROM Food ORDER BY id').all(),
      ingredients: db.prepare('SELECT * FROM Ingredient ORDER BY id').all(),
      allergens: db.prepare('SELECT * FROM Allergen ORDER BY id').all(),
      foodIngredients: db
        .prepare('SELECT * FROM FoodIngredient ORDER BY foodId, ingredientId')
        .all(),
      foodAllergens: db
        .prepare('SELECT * FROM FoodAllergen ORDER BY foodId, allergenId')
        .all(),
    };
  } finally {
    db.close();
  }
}

function addedRows(before: DatabaseSnapshot, after: DatabaseSnapshot) {
  const rowKey = (row: unknown) => JSON.stringify(row);
  const difference = (oldRows: unknown[], newRows: unknown[]) => {
    const oldKeys = new Set(oldRows.map(rowKey));
    return newRows.filter((row) => !oldKeys.has(rowKey(row)));
  };

  return {
    foods: difference(before.foods, after.foods),
    ingredients: difference(before.ingredients, after.ingredients),
    allergens: difference(before.allergens, after.allergens),
    foodIngredients: difference(before.foodIngredients, after.foodIngredients),
    foodAllergens: difference(before.foodAllergens, after.foodAllergens),
  };
}

function cleanupGeneratedLookupRows() {
  const db = openDatabase();
  try {
    db.prepare('DELETE FROM Ingredient WHERE name LIKE ?').run(`${FUZZ_PREFIX}%`);
    db.prepare('DELETE FROM Allergen WHERE name LIKE ?').run(`${FUZZ_PREFIX}%`);
  } finally {
    db.close();
  }
}

async function readResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

beforeAll(async () => {
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'alice@carvedrock.com',
      password: 'password123',
    }),
  });

  const loginBody = await readResponse(loginResponse);
  if (loginResponse.status !== 200) {
    throw new Error(
      `Fuzz test setup failed: login returned ${loginResponse.status}: ${JSON.stringify(loginBody)}`
    );
  }

  const setCookie = loginResponse.headers.get('set-cookie');
  sessionCookie = setCookie?.match(/(?:^|,\s*)(session_token=[^;,\s]+)/)?.[1] ?? '';
  if (!sessionCookie) {
    throw new Error('Fuzz test setup failed: login did not return session_token.');
  }

  const db = openDatabase();
  try {
    existingFoodNames = (
      db.prepare('SELECT name FROM Food ORDER BY id').all() as { name: string }[]
    ).map(({ name }) => name);
  } finally {
    db.close();
  }

  if (existingFoodNames.length === 0) {
    throw new Error('Fuzz test setup failed: no existing food is available to force a duplicate.');
  }

  cleanupGeneratedLookupRows();
});

afterAll(() => {
  cleanupGeneratedLookupRows();
});

describe('POST /api/foods fuzz invariants', () => {
  it(
    'leaves the database unchanged whenever creation fails',
    async () => {
      const tokenArbitrary = fc
        .stringMatching(/^[a-z0-9]{1,16}$/)
        .map((value) => `${FUZZ_PREFIX}${value}`);

      /*
       * The implementation accepts two ingredient shapes and forwards all nutrition
       * and category fields without validation. Varying all of them explores whether
       * any input-dependent path changes when lookup rows are written.
       *
       * The food name is chosen from the live database, not a fixed example list.
       * It guarantees the final unique Food insert fails after fresh generated
       * ingredients and allergens have already reached their upsert paths.
       */
      const payloadArbitrary: fc.Arbitrary<Payload> = fc
        .record({
          duplicateNameIndex: fc.nat(),
          calories: fc.double({ min: -1_000_000, max: 1_000_000, noNaN: true }),
          protein: fc.double({ min: -10_000, max: 10_000, noNaN: true }),
          carbs: fc.double({ min: -10_000, max: 10_000, noNaN: true }),
          fat: fc.double({ min: -10_000, max: 10_000, noNaN: true }),
          sugar: fc.option(
            fc.double({ min: -10_000, max: 10_000, noNaN: true }),
            { nil: undefined }
          ),
          fiber: fc.option(
            fc.double({ min: -10_000, max: 10_000, noNaN: true }),
            { nil: undefined }
          ),
          ingredientNames: fc.uniqueArray(tokenArbitrary, {
            minLength: 1,
            maxLength: 5,
          }),
          ingredientsAsArray: fc.boolean(),
          allergens: fc.uniqueArray(tokenArbitrary, {
            minLength: 1,
            maxLength: 5,
          }),
          category: fc.option(fc.string({ maxLength: 24 }), { nil: undefined }),
        })
        .map(({ duplicateNameIndex, ingredientNames, ingredientsAsArray, ...rest }) => ({
          ...rest,
          name: existingFoodNames[duplicateNameIndex % existingFoodNames.length],
          ingredients: ingredientsAsArray
            ? ingredientNames
            : ingredientNames.join(', '),
        }));

      const runDetails = await fc.check(
        fc.asyncProperty(payloadArbitrary, async (payload) => {
          propertyInvocations += 1;
          const before = snapshotDatabase();

          const response = await fetch(`${BASE_URL}/api/foods`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie: sessionCookie,
            },
            body: JSON.stringify(payload),
          });
          const responseBody = await readResponse(response);
          const after = snapshotDatabase();
          const leaked = addedRows(before, after);

          try {
            // A successful request would not exercise this selected invariant.
            expect(
              response.status,
              `Expected the duplicate food name to make creation fail. Body: ${JSON.stringify(responseBody)}`
            ).not.toBe(201);

            const unchanged = JSON.stringify(after) === JSON.stringify(before);
            if (!unchanged) {
              // Each failing shrink replaces this value, so the report below
              // contains fast-check's final minimized counterexample.
              finalFailure = {
                payload,
                responseStatus: response.status,
                responseBody,
                leaked,
              };
            }

            expect(
              after,
              `Failed POST changed database state. Leaked rows: ${JSON.stringify(leaked)}`
            ).toEqual(before);
          } finally {
            // Remove only fuzz-prefixed lookup rows so shrinking can retry the
            // smaller counterexample against the same starting state.
            cleanupGeneratedLookupRows();
          }
        }),
        {
          numRuns: NUM_RUNS,
          seed: SEED,
        }
      );

      console.log(
        [
          `Configured cases: ${NUM_RUNS}`,
          `Executed generated cases before failure: ${runDetails.numRuns}`,
          `Shrink attempts: ${runDetails.numShrinks}`,
          `Total property invocations: ${propertyInvocations}`,
        ].join(' | ')
      );

      if (runDetails.failed && finalFailure) {
        console.error(
          [
            'POST /api/foods invariant failure (minimized)',
            `generated payload: ${JSON.stringify(finalFailure.payload, null, 2)}`,
            `response status: ${finalFailure.responseStatus}`,
            `response body: ${JSON.stringify(finalFailure.responseBody, null, 2)}`,
            `leaked rows: ${JSON.stringify(finalFailure.leaked, null, 2)}`,
          ].join('\n')
        );
      }

      if (runDetails.failed) {
        throw runDetails.errorInstance;
      }
    },
    60_000
  );
});
