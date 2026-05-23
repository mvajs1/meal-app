import { describe, it, expect } from 'vitest';
import {
  scaleNutrition,
  calculateMacros,
  checkBalanced,
  checkCalorieTarget,
  generateDayFeedback,
} from '@/lib/utils/calculations';
import type { FoodWithGrams } from '@/lib/utils/calculations';

// ---------------------------------------------------------------------------
// INTENTIONAL TEST GAPS (for QA teaching):
//   - NO test for negative grams (scaleNutrition silently produces negative values)
//   - NO test questioning the sugar-to-carb ratio in "balanced" checks
// ---------------------------------------------------------------------------

// ── Helpers / Fixtures ─────────────────────────────────────────────────────

const chicken: FoodWithGrams = {
  name: 'Grilled Chicken Breast',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  sugar: 0,
  fiber: 0,
  grams: 200,
};

const rice: FoodWithGrams = {
  name: 'Brown Rice',
  calories: 123,
  protein: 2.7,
  carbs: 25.6,
  fat: 1,
  sugar: 0.4,
  fiber: 1.6,
  grams: 300,
};

const avocado: FoodWithGrams = {
  name: 'Avocado',
  calories: 160,
  protein: 2,
  carbs: 8.5,
  fat: 14.7,
  sugar: 0.7,
  fiber: 6.7,
  grams: 150,
};

// ── scaleNutrition ─────────────────────────────────────────────────────────

describe('scaleNutrition', () => {
  it('should scale per-100g values to actual grams consumed', () => {
    const result = scaleNutrition(chicken); // 200 g → factor 2
    expect(result.calories).toBeCloseTo(330);
    expect(result.protein).toBeCloseTo(62);
    expect(result.carbs).toBeCloseTo(0);
    expect(result.fat).toBeCloseTo(7.2);
  });

  it('should return zeros when grams is 0', () => {
    const food: FoodWithGrams = { ...chicken, grams: 0 };
    const result = scaleNutrition(food);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('should handle fractional grams (e.g. 50g = factor 0.5)', () => {
    const food: FoodWithGrams = { ...rice, grams: 50 };
    const result = scaleNutrition(food);
    expect(result.calories).toBeCloseTo(61.5);
    expect(result.carbs).toBeCloseTo(12.8);
  });

  it('should scale sugar and fiber correctly', () => {
    const result = scaleNutrition(avocado); // 150 g → factor 1.5
    expect(result.sugar).toBeCloseTo(1.05);
    expect(result.fiber).toBeCloseTo(10.05);
  });
});

// ── calculateMacros ────────────────────────────────────────────────────────

describe('calculateMacros', () => {
  it('should sum totals for multiple foods', () => {
    const result = calculateMacros([chicken, rice]);
    // chicken 200g: cal 330, protein 62, carbs 0, fat 7.2
    // rice 300g:    cal 369, protein 8.1, carbs 76.8, fat 3
    expect(result.totalCalories).toBeCloseTo(699);
    expect(result.totalProtein).toBeCloseTo(70.1);
    expect(result.totalCarbs).toBeCloseTo(76.8);
    expect(result.totalFat).toBeCloseTo(10.2);
  });

  it('should compute macro percentages based on caloric contribution', () => {
    const result = calculateMacros([chicken, rice]);
    // proteinCals = 70.1*4 = 280.4; carbsCals = 76.8*4 = 307.2; fatCals = 10.2*9 = 91.8
    // totalMacroCals = 679.4
    expect(result.proteinPercent).toBeCloseTo((280.4 / 679.4) * 100, 0);
    expect(result.carbsPercent).toBeCloseTo((307.2 / 679.4) * 100, 0);
    expect(result.fatPercent).toBeCloseTo((91.8 / 679.4) * 100, 0);
  });

  it('should return zero percents for an empty food list', () => {
    const result = calculateMacros([]);
    expect(result.totalCalories).toBe(0);
    expect(result.proteinPercent).toBe(0);
    expect(result.carbsPercent).toBe(0);
    expect(result.fatPercent).toBe(0);
  });

  it('should handle a single food', () => {
    const result = calculateMacros([avocado]);
    expect(result.totalCalories).toBeCloseTo(240);
    expect(result.totalProtein).toBeCloseTo(3);
  });
});

// ── checkBalanced ──────────────────────────────────────────────────────────

describe('checkBalanced', () => {
  it('should mark a well-balanced meal as balanced', () => {
    // Chicken + Rice + Avocado gives a reasonable macro split
    const result = checkBalanced([chicken, rice, avocado]);
    // Verify the result has the expected shape
    expect(result).toHaveProperty('isBalanced');
    expect(result).toHaveProperty('proteinPercent');
    expect(result).toHaveProperty('feedback');
  });

  it('should mark an all-protein meal as NOT balanced', () => {
    const result = checkBalanced([chicken]);
    expect(result.isBalanced).toBe(false);
    expect(result.feedback).toContain('macros need adjustment');
  });

  it('should return balanced feedback text when balanced', () => {
    // Build a meal that hits ~25% protein, ~50% carbs, ~25% fat by calories
    // We need: proteinCals = 25%, carbsCals = 50%, fatCals = 25%
    // Let's use protein 25g (100cal), carbs 50g (200cal), fat ~11.1g (100cal)
    const balancedFood: FoodWithGrams = {
      name: 'Perfectly Balanced Meal',
      calories: 400,
      protein: 25,
      carbs: 50,
      fat: 11.1,
      sugar: 5,
      fiber: 3,
      grams: 100, // factor = 1
    };
    const result = checkBalanced([balancedFood]);
    expect(result.isBalanced).toBe(true);
    expect(result.feedback).toContain('Great job');
  });

  // "Fake Healthy Day" — extremely low calories but balanced macros → still passes
  it('should mark a tiny 50-calorie day as balanced if macro ratios are correct', () => {
    const tinyMeal: FoodWithGrams = {
      name: 'Tiny But Balanced',
      calories: 50,
      protein: 3.1,  // 12.4 cal → ~25%
      carbs: 6.25,   // 25 cal → ~50%
      fat: 1.4,      // 12.6 cal → ~25%
      sugar: 1,
      fiber: 0.5,
      grams: 100,
    };
    const result = checkBalanced([tinyMeal]);
    // The flaw: 50 calories for a day is nowhere near adequate,
    // but checkBalanced only checks percentages.
    expect(result.isBalanced).toBe(true);
  });

  // "All Sugar Carbs" — carbs are 100% sugar but macro split is fine → still passes
  it('should mark an all-sugar-carbs meal as balanced if macro ratios are correct', () => {
    const sugarMeal: FoodWithGrams = {
      name: 'Sugar Bomb',
      calories: 400,
      protein: 25,
      carbs: 50,     // all carbs from sugar
      fat: 11.1,
      sugar: 50,     // sugar == carbs (100% sugar)
      fiber: 0,
      grams: 100,
    };
    const result = checkBalanced([sugarMeal]);
    // The flaw: sugar-to-carb ratio is 100%, yet it's "balanced."
    expect(result.isBalanced).toBe(true);
  });
});

// ── checkCalorieTarget ─────────────────────────────────────────────────────

describe('checkCalorieTarget', () => {
  it('should be within target when calories match exactly', () => {
    const result = checkCalorieTarget(2000, 2000);
    expect(result.withinTarget).toBe(true);
    expect(result.deviation).toBeCloseTo(0);
    expect(result.message).toContain('On track');
  });

  it('should be within target at +10% boundary', () => {
    const result = checkCalorieTarget(2200, 2000);
    expect(result.withinTarget).toBe(true);
    expect(result.deviation).toBeCloseTo(10);
  });

  it('should be within target at -10% boundary', () => {
    const result = checkCalorieTarget(1800, 2000);
    expect(result.withinTarget).toBe(true);
    expect(result.deviation).toBeCloseTo(-10);
  });

  it('should be off target when exceeding +10%', () => {
    const result = checkCalorieTarget(2500, 2000);
    expect(result.withinTarget).toBe(false);
    expect(result.deviation).toBeCloseTo(25);
    expect(result.message).toContain('Off target');
    expect(result.message).toContain('+');
  });

  it('should be off target when below -10%', () => {
    const result = checkCalorieTarget(1500, 2000);
    expect(result.withinTarget).toBe(false);
    expect(result.deviation).toBeCloseTo(-25);
  });
});

// ── generateDayFeedback ────────────────────────────────────────────────────

describe('generateDayFeedback', () => {
  it('should return perfect day feedback when balanced and within target', () => {
    const result = generateDayFeedback(
      { isBalanced: true, proteinPercent: 25, carbsPercent: 50, fatPercent: 25, feedback: '' },
      { withinTarget: true }
    );
    expect(result).toContain('Perfect day');
  });

  it('should mention calories when balanced but off calorie target', () => {
    const result = generateDayFeedback(
      { isBalanced: true, proteinPercent: 25, carbsPercent: 50, fatPercent: 25, feedback: '' },
      { withinTarget: false }
    );
    expect(result).toContain('macros are balanced');
    expect(result).toContain('calories');
  });

  it('should mention macros when within target but not balanced', () => {
    const result = generateDayFeedback(
      { isBalanced: false, proteinPercent: 60, carbsPercent: 20, fatPercent: 20, feedback: '' },
      { withinTarget: true }
    );
    expect(result).toContain('Calories are on track');
    expect(result).toContain('macro');
  });

  it('should mention both when neither balanced nor within target', () => {
    const result = generateDayFeedback(
      { isBalanced: false, proteinPercent: 60, carbsPercent: 20, fatPercent: 20, feedback: '' },
      { withinTarget: false }
    );
    expect(result).toContain('Room for improvement');
  });
});
