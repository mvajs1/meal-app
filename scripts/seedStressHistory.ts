import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function positiveIntFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function boolFromEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'y'].includes(raw.toLowerCase());
}

function utcDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

async function main() {
  const email = process.env.STRESS_USER_EMAIL ?? 'alice@carvedrock.com';
  const days = positiveIntFromEnv('STRESS_DAYS', 30);
  const entriesPerDay = positiveIntFromEnv('STRESS_ENTRIES_PER_DAY', 150);
  const batchSize = positiveIntFromEnv('STRESS_BATCH_SIZE', 1000);
  const clearExisting = boolFromEnv('STRESS_CLEAR_EXISTING', false);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}. Run the normal seed first.`);
  }

  const foods = await prisma.food.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (foods.length === 0) {
    throw new Error('No foods found. Run the normal seed first.');
  }

  if (clearExisting) {
    const deleted = await prisma.foodLog.deleteMany({ where: { userId: user.id } });
    console.log(`Cleared ${deleted.count} existing food log(s) for ${email}.`);
  }

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const total = days * entriesPerDay;
  let created = 0;
  let batch: {
    userId: number;
    foodId: number;
    grams: number;
    mealType: string;
    date: Date;
  }[] = [];

  async function flush() {
    if (batch.length === 0) return;
    await prisma.foodLog.createMany({ data: batch });
    created += batch.length;
    console.log(`Created ${created}/${total} stress-history food log entries.`);
    batch = [];
  }

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const date = utcDateDaysAgo(dayOffset);

    for (let entry = 0; entry < entriesPerDay; entry += 1) {
      const food = foods[(dayOffset * entriesPerDay + entry) % foods.length];
      batch.push({
        userId: user.id,
        foodId: food.id,
        grams: 25 + ((entry * 17 + dayOffset * 11) % 325),
        mealType: mealTypes[entry % mealTypes.length],
        date,
      });

      if (batch.length >= batchSize) {
        await flush();
      }
    }
  }

  await flush();

  const from = utcDateDaysAgo(days - 1).toISOString().slice(0, 10);
  const to = utcDateDaysAgo(0).toISOString().slice(0, 10);

  console.log('');
  console.log('Stress-history data seed complete.');
  console.log(`User: ${email}`);
  console.log(`Entries created: ${created}`);
  console.log(`Date range: ${from} to ${to}`);
  console.log('');
  console.log('Demo endpoint:');
  console.log(`/api/food-log/history?from=${from}&to=${to}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
