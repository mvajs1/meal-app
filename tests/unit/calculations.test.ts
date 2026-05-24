import { describe, expect, it } from 'vitest';
import { calculateMacros, checkBalanced } from '@/lib/utils/calculations';
import type { FoodWithGrams } from '@/lib/utils/calculations';

const food = (overrides: Partial<FoodWithGrams>): FoodWithGrams => ({
  name: 'Test Food',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  fiber: 0,
  grams: 100,
  ...overrides,
});

const macroSplitFood = (
  proteinPercent: number,
  carbsPercent: number,
  fatPercent: number
): FoodWithGrams =>
  food({
    name: `${proteinPercent}/${carbsPercent}/${fatPercent} split`,
    calories: 100,
    protein: proteinPercent / 4,
    carbs: carbsPercent / 4,
    fat: fatPercent / 9,
  });

describe('calculateMacros', () => {
  it('returns zero totals and percentages for an empty food list', () => {
    expect(calculateMacros([])).toEqual({
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalSugar: 0,
      totalFiber: 0,
      proteinPercent: 0,
      carbsPercent: 0,
      fatPercent: 0,
    });
  });

  it('scales every tracked nutrition field for one food', () => {
    const result = calculateMacros([
      food({
        calories: 240,
        protein: 20,
        carbs: 30,
        fat: 10,
        sugar: 8,
        fiber: 6,
        grams: 50,
      }),
    ]);

    expect(result.totalCalories).toBeCloseTo(120);
    expect(result.totalProtein).toBeCloseTo(10);
    expect(result.totalCarbs).toBeCloseTo(15);
    expect(result.totalFat).toBeCloseTo(5);
    expect(result.totalSugar).toBeCloseTo(4);
    expect(result.totalFiber).toBeCloseTo(3);
    expect(result.proteinPercent).toBeCloseTo((40 / 145) * 100);
    expect(result.carbsPercent).toBeCloseTo((60 / 145) * 100);
    expect(result.fatPercent).toBeCloseTo((45 / 145) * 100);
  });

  it('sums scaled totals across multiple foods', () => {
    const result = calculateMacros([
      food({
        name: 'Protein base',
        calories: 200,
        protein: 30,
        carbs: 5,
        fat: 4,
        sugar: 2,
        fiber: 1,
        grams: 150,
      }),
      food({
        name: 'Carb base',
        calories: 120,
        protein: 4,
        carbs: 25,
        fat: 2,
        sugar: 6,
        fiber: 5,
        grams: 80,
      }),
    ]);

    expect(result.totalCalories).toBeCloseTo(396);
    expect(result.totalProtein).toBeCloseTo(48.2);
    expect(result.totalCarbs).toBeCloseTo(27.5);
    expect(result.totalFat).toBeCloseTo(7.6);
    expect(result.totalSugar).toBeCloseTo(7.8);
    expect(result.totalFiber).toBeCloseTo(5.5);
  });

  it('bases macro percentages on macro calories, not the listed calorie total', () => {
    const result = calculateMacros([
      food({
        calories: 999,
        protein: 25,
        carbs: 50,
        fat: 100 / 9,
      }),
    ]);

    expect(result.totalCalories).toBe(999);
    expect(result.proteinPercent).toBeCloseTo(25);
    expect(result.carbsPercent).toBeCloseTo(50);
    expect(result.fatPercent).toBeCloseTo(25);
  });

  it('returns zero percentages when calories exist but macros do not', () => {
    const result = calculateMacros([
      food({
        calories: 500,
        protein: 0,
        carbs: 0,
        fat: 0,
      }),
    ]);

    expect(result.totalCalories).toBe(500);
    expect(result.proteinPercent).toBe(0);
    expect(result.carbsPercent).toBe(0);
    expect(result.fatPercent).toBe(0);
  });

  it('preserves the current behavior for fractional and negative grams', () => {
    const result = calculateMacros([
      food({
        name: 'Fractional serving',
        calories: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        sugar: 4,
        fiber: 2,
        grams: 12.5,
      }),
      food({
        name: 'Negative serving',
        calories: 200,
        protein: 8,
        carbs: 12,
        fat: 4,
        sugar: 3,
        fiber: 1,
        grams: -25,
      }),
    ]);

    expect(result.totalCalories).toBeCloseTo(-37.5);
    expect(result.totalProtein).toBeCloseTo(-0.75);
    expect(result.totalCarbs).toBeCloseTo(-0.5);
    expect(result.totalFat).toBeCloseTo(-0.375);
    expect(result.totalSugar).toBeCloseTo(-0.25);
    expect(result.totalFiber).toBeCloseTo(0);
    expect(result.proteinPercent).toBe(0);
    expect(result.carbsPercent).toBe(0);
    expect(result.fatPercent).toBe(0);
  });
});

describe('checkBalanced', () => {
  it('returns a balanced result with percentages and success feedback', () => {
    const result = checkBalanced([macroSplitFood(25, 50, 25)]);

    expect(result.isBalanced).toBe(true);
    expect(result.proteinPercent).toBeCloseTo(25);
    expect(result.carbsPercent).toBeCloseTo(50);
    expect(result.fatPercent).toBeCloseTo(25);
    expect(result.feedback).toBe('Great job! Your meal has a balanced macro split. Keep it up!');
  });

  it('returns rounded adjustment feedback when macros are unbalanced', () => {
    const result = checkBalanced([macroSplitFood(70.25, 19.25, 10.5)]);

    expect(result.isBalanced).toBe(false);
    expect(result.feedback).toBe(
      'Your macros need adjustment. Protein: 70.3%, Carbs: 19.3%, Fat: 10.5%. Aim for Protein 20-35%, Carbs 40-60%, Fat 20-35%.'
    );
  });

  it.each([
    [20, 45, 35],
    [35, 40, 25],
    [20, 60, 20],
  ])(
    'treats %i%% protein, %i%% carbs, and %i%% fat as balanced inclusive boundaries',
    (proteinPercent, carbsPercent, fatPercent) => {
      const result = checkBalanced([
        macroSplitFood(proteinPercent, carbsPercent, fatPercent),
      ]);

      expect(result.isBalanced).toBe(true);
      expect(result.proteinPercent).toBeCloseTo(proteinPercent);
      expect(result.carbsPercent).toBeCloseTo(carbsPercent);
      expect(result.fatPercent).toBeCloseTo(fatPercent);
    }
  );

  it.each([
    ['protein below range', 19, 50, 31],
    ['protein above range', 36, 44, 20],
    ['carbs below range', 30, 35, 35],
    ['carbs above range', 20, 61, 19],
    ['fat below range', 35, 46, 19],
    ['fat above range', 20, 44, 36],
  ])('marks a meal unbalanced when %s', (_caseName, proteinPercent, carbsPercent, fatPercent) => {
    const result = checkBalanced([
      macroSplitFood(proteinPercent, carbsPercent, fatPercent),
    ]);

    expect(result.isBalanced).toBe(false);
    expect(result.proteinPercent).toBeCloseTo(proteinPercent);
    expect(result.carbsPercent).toBeCloseTo(carbsPercent);
    expect(result.fatPercent).toBeCloseTo(fatPercent);
    expect(result.feedback).toContain('Your macros need adjustment.');
  });

  it('returns an unbalanced result with zeroed feedback values for empty input', () => {
    const result = checkBalanced([]);

    expect(result.isBalanced).toBe(false);
    expect(result.proteinPercent).toBe(0);
    expect(result.carbsPercent).toBe(0);
    expect(result.fatPercent).toBe(0);
    expect(result.feedback).toBe(
      'Your macros need adjustment. Protein: 0.0%, Carbs: 0.0%, Fat: 0.0%. Aim for Protein 20-35%, Carbs 40-60%, Fat 20-35%.'
    );
  });
});
