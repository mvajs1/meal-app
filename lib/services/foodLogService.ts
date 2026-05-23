import prisma from '@/lib/db';
import {
  calculateMacros,
  checkBalanced,
  checkCalorieTarget,
  generateDayFeedback,
  FoodWithGrams,
} from '@/lib/utils/calculations';
import { toDateOnlyUTC, fromDateOnlyUTC } from '@/lib/utils/date';

export async function addFoodLog(
  userId: number,
  foodId: number,
  grams: number,
  mealType: string,
  date: string
) {
  const log = await prisma.foodLog.create({
    data: { userId, foodId, grams, mealType, date: toDateOnlyUTC(date) },
    include: { food: true },
  });
  return { ...log, date: fromDateOnlyUTC(log.date) };
}

export async function getFoodLogsForDate(userId: number, date: string) {
  const logs = await prisma.foodLog.findMany({
    where: { userId, date: toDateOnlyUTC(date) },
    include: { food: true },
    orderBy: [{ mealType: 'asc' }, { createdAt: 'asc' }],
  });
  return logs.map((l) => ({ ...l, date: fromDateOnlyUTC(l.date) }));
}

export async function deleteFoodLog(id: number, userId: number) {
  const log = await prisma.foodLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    throw new Error('Not found or unauthorized');
  }
  return prisma.foodLog.delete({ where: { id } });
}

export async function clearLogsForDate(userId: number, date: string) {
  const result = await prisma.foodLog.deleteMany({
    where: { userId, date: toDateOnlyUTC(date) },
  });
  return result.count;
}

export async function getDailySummary(
  userId: number,
  date: string,
  calorieTarget: number
) {
  const logs = await getFoodLogsForDate(userId, date);

  const foods: FoodWithGrams[] = logs.map((log) => ({
    name: log.food.name,
    calories: log.food.calories,
    protein: log.food.protein,
    carbs: log.food.carbs,
    fat: log.food.fat,
    sugar: log.food.sugar,
    fiber: log.food.fiber,
    grams: log.grams,
  }));

  const macros = calculateMacros(foods);
  const balanced = checkBalanced(foods);
  const calorieCheck = checkCalorieTarget(macros.totalCalories, calorieTarget);
  const feedback = generateDayFeedback(balanced, calorieCheck);

  return { date, macros, balanced, calorieCheck, feedback, logs };
}

export async function getHistoryRange(
  userId: number,
  from: string,
  to: string,
  calorieTarget: number
) {
  const logs = await prisma.foodLog.findMany({
    where: {
      userId,
      date: { gte: toDateOnlyUTC(from), lte: toDateOnlyUTC(to) },
    },
    include: { food: true },
    orderBy: [{ date: 'desc' }, { mealType: 'asc' }],
  });

  const byDate: Record<string, typeof logs> = {};
  for (const log of logs) {
    const key = fromDateOnlyUTC(log.date);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(log);
  }

  return Object.entries(byDate).map(([date, dayLogs]) => {
    const foods: FoodWithGrams[] = dayLogs.map((log) => ({
      name: log.food.name,
      calories: log.food.calories,
      protein: log.food.protein,
      carbs: log.food.carbs,
      fat: log.food.fat,
      sugar: log.food.sugar,
      fiber: log.food.fiber,
      grams: log.grams,
    }));

    const macros = calculateMacros(foods);
    const balanced = checkBalanced(foods);
    const calorieCheck = checkCalorieTarget(macros.totalCalories, calorieTarget);
    const feedback = generateDayFeedback(balanced, calorieCheck);

    return {
      date,
      macros,
      balanced,
      calorieCheck,
      feedback,
      entryCount: dayLogs.length,
    };
  });
}
