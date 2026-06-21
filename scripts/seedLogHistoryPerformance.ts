import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'alice@carvedrock.com';
const DAYS_TO_SEED = 365;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const ENTRIES_PER_MEAL = 3;
const INSERT_BATCH_SIZE = 500;

const GRAMS_BY_MEAL = {
  breakfast: [80, 120, 180],
  lunch: [100, 160, 220],
  dinner: [110, 170, 230],
  snack: [30, 60, 100],
} satisfies Record<(typeof MEAL_TYPES)[number], number[]>;

function utcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const alice = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!alice) {
    throw new Error(
      `User ${USER_EMAIL} does not exist. Run "npm run db:seed" first.`
    );
  }

  const foods = await prisma.food.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (foods.length === 0) {
    throw new Error('No seeded foods found. Run "npm run db:seed" first.');
  }

  const today = utcDateOnly(new Date());
  const from = addUtcDays(today, -DAYS_TO_SEED);
  const to = today;

  await prisma.foodLog.deleteMany({ where: { userId: alice.id } });

  const entries: {
    userId: number;
    foodId: number;
    grams: number;
    mealType: string;
    date: Date;
  }[] = [];
  let foodIndex = 0;

  for (let dayOffset = 0; dayOffset < DAYS_TO_SEED; dayOffset += 1) {
    const date = addUtcDays(from, dayOffset);

    for (const mealType of MEAL_TYPES) {
      for (let entryIndex = 0; entryIndex < ENTRIES_PER_MEAL; entryIndex += 1) {
        entries.push({
          userId: alice.id,
          foodId: foods[foodIndex % foods.length].id,
          grams: GRAMS_BY_MEAL[mealType][entryIndex],
          mealType,
          date,
        });
        foodIndex += 1;
      }
    }
  }

  for (let offset = 0; offset < entries.length; offset += INSERT_BATCH_SIZE) {
    await prisma.foodLog.createMany({
      data: entries.slice(offset, offset + INSERT_BATCH_SIZE),
    });
  }

  const insertedCount = await prisma.foodLog.count({
    where: { userId: alice.id },
  });
  const expectedCount = DAYS_TO_SEED * MEAL_TYPES.length * ENTRIES_PER_MEAL;

  if (insertedCount !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} food logs for Alice, found ${insertedCount}.`
    );
  }

  console.log(`Seeded ${insertedCount.toLocaleString()} food-log entries for ${USER_EMAIL}.`);
  console.log(`Performance date range: from=${formatDate(from)} to=${formatDate(to)}`);
}

main()
  .catch((error) => {
    console.error('Performance history seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
