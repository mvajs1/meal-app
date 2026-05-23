import { describe, it, expect } from 'vitest';
import {
  filterAllergens,
  hasAllergen,
  checkRepetition,
  isValidEmail,
  isValidPassword,
} from '@/lib/utils/validators';
import type { FoodWithAllergens } from '@/lib/utils/validators';

// ---------------------------------------------------------------------------
// INTENTIONAL TEST GAPS (for QA teaching):
//   - NO test for same-content-different-name meals bypassing repetition check
//   - NO test for ingredients text vs allergens array mismatch
// ---------------------------------------------------------------------------

// ── Fixtures ───────────────────────────────────────────────────────────────

const peanutButterToast: FoodWithAllergens = {
  name: 'Peanut Butter Toast',
  calories: 250,
  protein: 8,
  carbs: 30,
  fat: 12,
  sugar: 6,
  fiber: 2,
  grams: 100,
  allergens: ['peanuts', 'gluten'],
};

const greekSalad: FoodWithAllergens = {
  name: 'Greek Salad',
  calories: 120,
  protein: 5,
  carbs: 10,
  fat: 8,
  sugar: 4,
  fiber: 3,
  grams: 200,
  allergens: ['dairy'],
};

const grilledChicken: FoodWithAllergens = {
  name: 'Grilled Chicken',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  sugar: 0,
  fiber: 0,
  grams: 200,
  allergens: [],
};

const shrimpPasta: FoodWithAllergens = {
  name: 'Shrimp Pasta',
  calories: 350,
  protein: 20,
  carbs: 40,
  fat: 12,
  sugar: 3,
  fiber: 2,
  grams: 300,
  allergens: ['shellfish', 'gluten'],
};

const allFoods = [peanutButterToast, greekSalad, grilledChicken, shrimpPasta];

// ── filterAllergens ────────────────────────────────────────────────────────

describe('filterAllergens', () => {
  it('should return all foods when user has no allergies', () => {
    const result = filterAllergens(allFoods, []);
    expect(result).toHaveLength(4);
  });

  it('should remove foods containing a single allergen', () => {
    const result = filterAllergens(allFoods, ['peanuts']);
    expect(result).toHaveLength(3);
    expect(result.find((f) => f.name === 'Peanut Butter Toast')).toBeUndefined();
  });

  it('should remove all foods matching any of the user allergies', () => {
    const result = filterAllergens(allFoods, ['gluten']);
    // Removes Peanut Butter Toast and Shrimp Pasta (both contain gluten)
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual(['Greek Salad', 'Grilled Chicken']);
  });

  it('should keep foods with no allergens regardless of user allergies', () => {
    const result = filterAllergens(allFoods, ['peanuts', 'dairy', 'gluten', 'shellfish']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Grilled Chicken');
  });

  it('should return all foods when user allergies do not match any food allergens', () => {
    const result = filterAllergens(allFoods, ['soy', 'eggs']);
    expect(result).toHaveLength(4);
  });

  it('should handle an empty food list', () => {
    const result = filterAllergens([], ['peanuts']);
    expect(result).toHaveLength(0);
  });
});

// ── hasAllergen ────────────────────────────────────────────────────────────

describe('hasAllergen', () => {
  it('should return true when an allergen matches', () => {
    expect(hasAllergen(['peanuts', 'gluten'], ['peanuts'])).toBe(true);
  });

  it('should return false when no allergen matches', () => {
    expect(hasAllergen(['peanuts', 'gluten'], ['dairy'])).toBe(false);
  });

  it('should return false for an empty allergens list', () => {
    expect(hasAllergen([], ['peanuts'])).toBe(false);
  });

  it('should return false when user has no allergies', () => {
    expect(hasAllergen(['peanuts'], [])).toBe(false);
  });

  it('should detect overlap with multiple allergens', () => {
    expect(hasAllergen(['shellfish', 'gluten'], ['gluten', 'soy'])).toBe(true);
  });
});

// ── checkRepetition ────────────────────────────────────────────────────────

describe('checkRepetition', () => {
  it('should be valid when no meal repeats more than twice', () => {
    const result = checkRepetition(['Oatmeal', 'Salad', 'Oatmeal', 'Soup']);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should flag a meal that appears 3 times', () => {
    const result = checkRepetition(['Oatmeal', 'Oatmeal', 'Oatmeal', 'Soup']);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('Oatmeal');
  });

  it('should flag multiple violations', () => {
    const result = checkRepetition([
      'Oatmeal', 'Oatmeal', 'Oatmeal',
      'Soup', 'Soup', 'Soup',
      'Salad',
    ]);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations).toContain('Oatmeal');
    expect(result.violations).toContain('Soup');
  });

  it('should be valid with exactly 2 repetitions (boundary)', () => {
    const result = checkRepetition(['Oatmeal', 'Oatmeal', 'Soup', 'Salad']);
    expect(result.valid).toBe(true);
  });

  it('should be valid for an empty list', () => {
    const result = checkRepetition([]);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

// ── isValidEmail ───────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('should accept a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should accept email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('should reject email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

// ── isValidPassword ────────────────────────────────────────────────────────

describe('isValidPassword', () => {
  it('should accept a password of 6 characters', () => {
    expect(isValidPassword('abcdef')).toBe(true);
  });

  it('should accept a longer password', () => {
    expect(isValidPassword('strongP@ssw0rd!')).toBe(true);
  });

  it('should reject a password shorter than 6 characters', () => {
    expect(isValidPassword('abc')).toBe(false);
  });

  it('should reject an empty password', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('should accept exactly 6 characters (boundary)', () => {
    expect(isValidPassword('123456')).toBe(true);
  });

  it('should reject 5 characters (boundary)', () => {
    expect(isValidPassword('12345')).toBe(false);
  });
});
