// Pure functions for nutritional calculations
// IMPORTANT: This file contains INTENTIONALLY FLAWED logic for QA teaching purposes

export interface FoodWithGrams {
  name: string;
  calories: number;  // per 100g
  protein: number;   // per 100g
  carbs: number;     // per 100g
  fat: number;       // per 100g
  sugar: number;     // per 100g
  fiber: number;     // per 100g
  grams: number;     // actual amount consumed
}

export interface MacroSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSugar: number;
  totalFiber: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface BalancedResult {
  isBalanced: boolean;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  feedback: string;
}

/**
 * Scale nutritional values from per-100g to actual grams consumed.
 * NOTE: No validation on negative grams — this is intentional (Flaw 6).
 */
export function scaleNutrition(food: FoodWithGrams) {
  const factor = food.grams / 100;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    sugar: food.sugar * factor,
    fiber: food.fiber * factor,
  };
}

/**
 * Calculate macro summary for a collection of foods.
 * Macro percentages are derived from caloric contribution:
 *   protein = 4 cal/g, carbs = 4 cal/g, fat = 9 cal/g
 */
export function calculateMacros(foods: FoodWithGrams[]): MacroSummary {
  const totals = foods.reduce(
    (acc, food) => {
      const scaled = scaleNutrition(food);
      return {
        totalCalories: acc.totalCalories + scaled.calories,
        totalProtein: acc.totalProtein + scaled.protein,
        totalCarbs: acc.totalCarbs + scaled.carbs,
        totalFat: acc.totalFat + scaled.fat,
        totalSugar: acc.totalSugar + scaled.sugar,
        totalFiber: acc.totalFiber + scaled.fiber,
      };
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalSugar: 0, totalFiber: 0 }
  );

  const proteinCals = totals.totalProtein * 4;
  const carbsCals = totals.totalCarbs * 4;
  const fatCals = totals.totalFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;

  return {
    ...totals,
    proteinPercent: totalMacroCals > 0 ? (proteinCals / totalMacroCals) * 100 : 0,
    carbsPercent: totalMacroCals > 0 ? (carbsCals / totalMacroCals) * 100 : 0,
    fatPercent: totalMacroCals > 0 ? (fatCals / totalMacroCals) * 100 : 0,
  };
}

/**
 * Check if a set of foods has a "balanced" macro split.
 */
export function checkBalanced(foods: FoodWithGrams[]): BalancedResult {
  const macros = calculateMacros(foods);
  const { proteinPercent, carbsPercent, fatPercent } = macros;

  const proteinOk = proteinPercent >= 20 && proteinPercent <= 35;
  const carbsOk = carbsPercent >= 40 && carbsPercent <= 60;
  const fatOk = fatPercent >= 20 && fatPercent <= 35;
  const isBalanced = proteinOk && carbsOk && fatOk;

  const feedback = isBalanced
    ? 'Great job! Your meal has a balanced macro split. Keep it up!'
    : `Your macros need adjustment. Protein: ${proteinPercent.toFixed(1)}%, Carbs: ${carbsPercent.toFixed(1)}%, Fat: ${fatPercent.toFixed(1)}%. Aim for Protein 20-35%, Carbs 40-60%, Fat 20-35%.`;

  return { isBalanced, proteinPercent, carbsPercent, fatPercent, feedback };
}

/**
 * Check if daily calories are within ±10% of target.
 * NOTE: Per-day only — no weekly aggregate check (Flaw 5).
 */
export function checkCalorieTarget(
  totalCalories: number,
  target: number
): { withinTarget: boolean; deviation: number; message: string } {
  const deviation = ((totalCalories - target) / target) * 100;
  const withinTarget = Math.abs(deviation) <= 10;
  const message = withinTarget
    ? `On track! ${Math.round(totalCalories)} cal (target: ${target})`
    : `Off target: ${Math.round(totalCalories)} cal (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}% from ${target} target)`;
  return { withinTarget, deviation, message };
}

/**
 * Generate feedback for a day's nutrition.
 * Returns encouraging text even for problematic days (intentional).
 */
export function generateDayFeedback(
  balanced: BalancedResult,
  calorieCheck: { withinTarget: boolean }
): string {
  if (balanced.isBalanced && calorieCheck.withinTarget) {
    return 'Perfect day! Your nutrition is balanced and within your calorie target. Keep this up!';
  }
  if (balanced.isBalanced) {
    return 'Your macros are balanced! Just watch your total calories.';
  }
  if (calorieCheck.withinTarget) {
    return 'Calories are on track. Try adjusting your macro balance.';
  }
  return 'Room for improvement — adjust both your macros and calorie intake.';
}
