import { afterAll, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

process.env.DATABASE_URL = ':memory:';

const adapter = new PrismaBetterSqlite3({ url: ':memory:' });
const prisma = new PrismaClient({ adapter });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

globalForPrisma.prisma = prisma;

function migrationStatements() {
  const migrationPath = join(
    process.cwd(),
    'prisma/migrations/20260511071145_initial_relational_schema/migration.sql'
  );
  const sql = readFileSync(migrationPath, 'utf8');

  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

beforeAll(async () => {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  for (const table of [
    'FoodLog',
    'FoodIngredient',
    'FoodAllergen',
    'UserAllergen',
    'Food',
    'Ingredient',
    'Allergen',
    'User',
  ]) {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}"`);
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  for (const statement of migrationStatements()) {
    await prisma.$executeRawUnsafe(statement);
  }
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  await prisma.foodLog.deleteMany();
  await prisma.foodIngredient.deleteMany();
  await prisma.foodAllergen.deleteMany();
  await prisma.userAllergen.deleteMany();
  await prisma.food.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.allergen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRawUnsafe(
    [
      'DELETE FROM sqlite_sequence',
      "WHERE name IN ('User', 'Allergen', 'Ingredient', 'Food', 'FoodLog')",
    ].join(' ')
  );
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
});

afterAll(async () => {
  await prisma.$disconnect();
});
