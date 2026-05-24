import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import {
  addFoodLog,
  clearLogsForDate,
  deleteFoodLog,
  getDailySummary,
  getFoodLogsForDate,
} from '@/lib/services/foodLogService';
import { DELETE, GET, POST } from '@/app/api/food-log/route';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);

const currentUser = {
  id: 1,
  email: 'ada@example.com',
  name: 'Ada',
  calorieTarget: 500,
  goal: 'maintain',
  allergies: [],
  unitSystem: 'metric',
  locale: 'en-US',
};

async function createUser(overrides: Partial<typeof currentUser> = {}) {
  return prisma.user.create({
    data: {
      email: overrides.email ?? currentUser.email,
      passwordHash: 'hashed-password',
      name: overrides.name ?? currentUser.name,
      calorieTarget: overrides.calorieTarget ?? currentUser.calorieTarget,
      goal: overrides.goal ?? currentUser.goal,
      unitSystem: overrides.unitSystem ?? currentUser.unitSystem,
      locale: overrides.locale ?? currentUser.locale,
    },
  });
}

async function createFood(name: string, overrides: Partial<Prisma.FoodCreateInput> = {}) {
  return prisma.food.create({
    data: {
      name,
      calories: 400,
      protein: 25,
      carbs: 50,
      fat: 100 / 9,
      sugar: 10,
      fiber: 5,
      category: 'grain',
      isSystem: true,
      ...overrides,
    },
  });
}

function jsonRequest(method: string, path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined ? undefined : { 'content-type': 'application/json' },
  });
}

describe('food log service integration', () => {
  it('persists a food log with normalized date, user and food linkage, and included food data', async () => {
    const user = await createUser();
    const food = await createFood('Balanced Bowl');

    const log = await addFoodLog(user.id, food.id, 125, 'lunch', '2026-05-24');

    expect(log).toMatchObject({
      userId: user.id,
      foodId: food.id,
      grams: 125,
      mealType: 'lunch',
      date: '2026-05-24',
      food: expect.objectContaining({ id: food.id, name: 'Balanced Bowl' }),
    });

    const persisted = await prisma.foodLog.findUniqueOrThrow({ where: { id: log.id } });
    expect(persisted.date.toISOString()).toBe('2026-05-24T00:00:00.000Z');
  });

  it('retrieves logs only for the requested user and date with included foods', async () => {
    const user = await createUser();
    const otherUser = await createUser({ email: 'grace@example.com', name: 'Grace' });
    const breakfast = await createFood('Oats', { calories: 120, protein: 4, carbs: 20, fat: 2 });
    const dinner = await createFood('Tofu Rice', { calories: 220, protein: 16, carbs: 24, fat: 6 });

    await addFoodLog(user.id, dinner.id, 150, 'dinner', '2026-05-24');
    await addFoodLog(user.id, breakfast.id, 100, 'breakfast', '2026-05-24');
    await addFoodLog(user.id, breakfast.id, 100, 'breakfast', '2026-05-25');
    await addFoodLog(otherUser.id, breakfast.id, 100, 'breakfast', '2026-05-24');

    const logs = await getFoodLogsForDate(user.id, '2026-05-24');

    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.mealType)).toEqual(['breakfast', 'dinner']);
    expect(logs.map((log) => log.date)).toEqual(['2026-05-24', '2026-05-24']);
    expect(logs.map((log) => log.food.name)).toEqual(['Oats', 'Tofu Rice']);
  });

  it('aggregates persisted logs into the daily summary response shape', async () => {
    const user = await createUser({ calorieTarget: 500 });
    const balancedFood = await createFood('Balanced Plate');
    const fruit = await createFood('Fruit Cup', {
      calories: 100,
      protein: 1,
      carbs: 20,
      fat: 1,
      sugar: 12,
      fiber: 3,
      category: 'fruit',
    });

    await addFoodLog(user.id, balancedFood.id, 100, 'lunch', '2026-05-24');
    await addFoodLog(user.id, fruit.id, 50, 'snack', '2026-05-24');

    const summary = await getDailySummary(user.id, '2026-05-24', user.calorieTarget);

    expect(summary.date).toBe('2026-05-24');
    expect(summary.logs).toHaveLength(2);
    expect(summary.macros.totalCalories).toBeCloseTo(450);
    expect(summary.macros.totalProtein).toBeCloseTo(25.5);
    expect(summary.macros.totalCarbs).toBeCloseTo(60);
    expect(summary.macros.totalFat).toBeCloseTo(11.611);
    expect(summary.macros.totalSugar).toBeCloseTo(16);
    expect(summary.macros.totalFiber).toBeCloseTo(6.5);
    expect(summary.balanced.isBalanced).toBe(true);
    expect(summary.calorieCheck.withinTarget).toBe(true);
    expect(summary.feedback).toBe(
      'Perfect day! Your nutrition is balanced and within your calorie target. Keep this up!'
    );
  });

  it('clears only matching logs for the requested user and date', async () => {
    const user = await createUser();
    const otherUser = await createUser({ email: 'grace@example.com', name: 'Grace' });
    const food = await createFood('Soup');

    await addFoodLog(user.id, food.id, 100, 'lunch', '2026-05-24');
    await addFoodLog(user.id, food.id, 100, 'dinner', '2026-05-24');
    await addFoodLog(user.id, food.id, 100, 'lunch', '2026-05-25');
    await addFoodLog(otherUser.id, food.id, 100, 'lunch', '2026-05-24');

    await expect(clearLogsForDate(user.id, '2026-05-24')).resolves.toBe(2);

    const remaining = await prisma.foodLog.findMany({ orderBy: { id: 'asc' } });
    expect(remaining).toHaveLength(2);
    expect(remaining.map((log) => [log.userId, log.date.toISOString().slice(0, 10)])).toEqual([
      [user.id, '2026-05-25'],
      [otherUser.id, '2026-05-24'],
    ]);
  });

  it('rejects missing or unauthorized single-log deletion', async () => {
    const user = await createUser();
    const otherUser = await createUser({ email: 'grace@example.com', name: 'Grace' });
    const food = await createFood('Pasta');
    const log = await addFoodLog(otherUser.id, food.id, 100, 'dinner', '2026-05-24');

    await expect(deleteFoodLog(log.id, user.id)).rejects.toThrow('Not found or unauthorized');
    await expect(deleteFoodLog(9999, user.id)).rejects.toThrow('Not found or unauthorized');
    await expect(prisma.foodLog.count()).resolves.toBe(1);
  });
});

describe('food log API route integration', () => {
  beforeEach(() => {
    mockedGetCurrentUser.mockReset();
  });

  it('returns 401 for unauthenticated GET and POST requests', async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const getResponse = await GET(jsonRequest('GET', '/api/food-log?date=2026-05-24'));
    const postResponse = await POST(
      jsonRequest('POST', '/api/food-log', {
        foodId: 1,
        grams: 100,
        mealType: 'lunch',
        date: '2026-05-24',
      })
    );

    await expect(getResponse.json()).resolves.toEqual({ error: 'Not authenticated' });
    expect(getResponse.status).toBe(401);
    await expect(postResponse.json()).resolves.toEqual({ error: 'Not authenticated' });
    expect(postResponse.status).toBe(401);
  });

  it('returns 400 for missing GET date and missing POST fields', async () => {
    await createUser();
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const getResponse = await GET(jsonRequest('GET', '/api/food-log'));
    const postResponse = await POST(
      jsonRequest('POST', '/api/food-log', {
        foodId: 1,
        grams: 100,
        mealType: 'lunch',
      })
    );

    await expect(getResponse.json()).resolves.toEqual({ error: 'date parameter required' });
    expect(getResponse.status).toBe(400);
    await expect(postResponse.json()).resolves.toEqual({
      error: 'foodId, grams, mealType, and date are required',
    });
    expect(postResponse.status).toBe(400);
  });

  it('creates a persisted log through POST and returns it with food data', async () => {
    await createUser();
    const food = await createFood('API Bowl');
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const response = await POST(
      jsonRequest('POST', '/api/food-log', {
        foodId: food.id,
        grams: 175,
        mealType: 'lunch',
        date: '2026-05-24',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      userId: currentUser.id,
      foodId: food.id,
      grams: 175,
      mealType: 'lunch',
      date: '2026-05-24',
      food: expect.objectContaining({ name: 'API Bowl' }),
    });
    await expect(prisma.foodLog.count()).resolves.toBe(1);
  });

  it('returns 500 when POST cannot persist the requested food log', async () => {
    await createUser();
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const response = await POST(
      jsonRequest('POST', '/api/food-log', {
        foodId: 9999,
        grams: 100,
        mealType: 'lunch',
        date: '2026-05-24',
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
    await expect(prisma.foodLog.count()).resolves.toBe(0);
  });

  it('returns a daily summary from persisted logs through GET', async () => {
    const user = await createUser();
    const food = await createFood('Summary Plate');
    await addFoodLog(user.id, food.id, 100, 'breakfast', '2026-05-24');
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const response = await GET(jsonRequest('GET', '/api/food-log?date=2026-05-24'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      date: '2026-05-24',
      logs: [
        expect.objectContaining({
          mealType: 'breakfast',
          food: expect.objectContaining({ name: 'Summary Plate' }),
        }),
      ],
    });
    expect(body.macros.totalCalories).toBeCloseTo(400);
    expect(body.calorieCheck.withinTarget).toBe(false);
  });

  it('returns 400 without a DELETE date and clears matching logs with a date', async () => {
    const user = await createUser();
    const food = await createFood('Clearable Bowl');
    await addFoodLog(user.id, food.id, 100, 'breakfast', '2026-05-24');
    await addFoodLog(user.id, food.id, 100, 'dinner', '2026-05-25');
    mockedGetCurrentUser.mockResolvedValue(currentUser);

    const missingDateResponse = await DELETE(jsonRequest('DELETE', '/api/food-log'));
    expect(missingDateResponse.status).toBe(400);
    await expect(missingDateResponse.json()).resolves.toEqual({ error: 'date parameter required' });

    const response = await DELETE(jsonRequest('DELETE', '/api/food-log?date=2026-05-24'));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deleted: 1 });

    const remaining = await getFoodLogsForDate(user.id, '2026-05-25');
    expect(remaining).toHaveLength(1);
  });
});
