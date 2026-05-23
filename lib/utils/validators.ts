import { FoodWithGrams } from './calculations';

export interface FoodWithAllergens extends FoodWithGrams {
  allergens: string[];
}

/**
 * Filter out foods that match user's allergies.
 * NOTE: Only checks the `allergens` array — never reads the `ingredients` text (Flaw 4).
 */
export function filterAllergens(
  foods: FoodWithAllergens[],
  userAllergies: string[]
): FoodWithAllergens[] {
  if (userAllergies.length === 0) return foods;
  return foods.filter(
    (food) => !food.allergens.some((a) => userAllergies.includes(a))
  );
}

/**
 * Check if a food contains any of the user's allergens.
 */
export function hasAllergen(foodAllergens: string[], userAllergies: string[]): boolean {
  return foodAllergens.some((a) => userAllergies.includes(a));
}

/**
 * Check meal repetition: no meal name appears more than 2 times in a week.
 * NOTE: Checks names only, not content (Flaw 3).
 * Identical meals with different names bypass this check.
 */
export function checkRepetition(
  mealNames: string[]
): { valid: boolean; violations: string[] } {
  const counts: Record<string, number> = {};
  for (const name of mealNames) {
    counts[name] = (counts[name] || 0) + 1;
  }
  const violations = Object.entries(counts)
    .filter(([, count]) => count > 2)
    .map(([name]) => name);
  return { valid: violations.length === 0, violations };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}
