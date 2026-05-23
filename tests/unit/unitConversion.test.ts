import { describe, it, expect } from 'vitest';
import {
  gramsToOunces,
  ouncesToGrams,
  formatWeight,
  formatDate,
  parseNumericInput,
} from '@/lib/utils/unitConversion';

// ---------------------------------------------------------------------------
// INTENTIONAL TEST GAPS (for QA teaching):
//   - NO test for comma-based decimal separators (e.g. "1.500,5" German format)
//   - NO test for ambiguous date formats (e.g. MM/DD vs DD/MM interpretation)
// ---------------------------------------------------------------------------

// ── gramsToOunces ──────────────────────────────────────────────────────────

describe('gramsToOunces', () => {
  it('should convert 100 grams to approximately 3.527 ounces', () => {
    const result = gramsToOunces(100);
    expect(result).toBeCloseTo(3.5274, 3);
  });

  it('should return 0 for 0 grams', () => {
    expect(gramsToOunces(0)).toBe(0);
  });

  it('should convert 28.3495 grams to exactly 1 ounce', () => {
    expect(gramsToOunces(28.3495)).toBeCloseTo(1, 4);
  });

  it('should handle large values', () => {
    const result = gramsToOunces(1000);
    expect(result).toBeCloseTo(35.274, 2);
  });
});

// ── ouncesToGrams ──────────────────────────────────────────────────────────

describe('ouncesToGrams', () => {
  it('should convert 1 ounce to 28.3495 grams', () => {
    expect(ouncesToGrams(1)).toBeCloseTo(28.3495, 3);
  });

  it('should return 0 for 0 ounces', () => {
    expect(ouncesToGrams(0)).toBe(0);
  });

  it('should be the inverse of gramsToOunces', () => {
    const grams = 250;
    const ounces = gramsToOunces(grams);
    expect(ouncesToGrams(ounces)).toBeCloseTo(grams, 4);
  });

  it('should handle fractional ounces', () => {
    expect(ouncesToGrams(0.5)).toBeCloseTo(14.1748, 3);
  });
});

// ── formatWeight ───────────────────────────────────────────────────────────

describe('formatWeight', () => {
  it('should format in grams for metric system', () => {
    expect(formatWeight(250, 'metric')).toBe('250 g');
  });

  it('should round grams to nearest integer for metric', () => {
    expect(formatWeight(250.7, 'metric')).toBe('251 g');
  });

  it('should convert and format in ounces for imperial system', () => {
    const result = formatWeight(100, 'imperial');
    // 100g ≈ 3.5 oz
    expect(result).toBe('3.5 oz');
  });

  it('should format 0 grams correctly for metric', () => {
    expect(formatWeight(0, 'metric')).toBe('0 g');
  });

  it('should format 0 grams correctly for imperial', () => {
    expect(formatWeight(0, 'imperial')).toBe('0.0 oz');
  });

  it('should default to metric formatting for unknown unit systems', () => {
    // The function only checks for 'imperial'; anything else falls through to metric
    expect(formatWeight(100, 'unknown')).toBe('100 g');
  });
});

// ── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('should format a date in en-US locale', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const result = formatDate(date, 'en-US');
    expect(result).toContain('2026');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should format a date in en-GB locale', () => {
    const date = new Date(2026, 11, 25); // Dec 25, 2026
    const result = formatDate(date, 'en-GB');
    expect(result).toContain('2026');
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });

  it('should handle beginning of year', () => {
    const date = new Date(2026, 0, 1); // Jan 1, 2026
    const result = formatDate(date, 'en-US');
    expect(result).toContain('Jan');
    expect(result).toContain('1');
  });

  it('should handle end of year', () => {
    const date = new Date(2026, 11, 31); // Dec 31, 2026
    const result = formatDate(date, 'en-US');
    expect(result).toContain('Dec');
    expect(result).toContain('31');
  });
});

// ── parseNumericInput ──────────────────────────────────────────────────────

describe('parseNumericInput', () => {
  it('should parse a simple integer string', () => {
    expect(parseNumericInput('42')).toBe(42);
  });

  it('should parse a decimal string', () => {
    expect(parseNumericInput('3.14')).toBeCloseTo(3.14);
  });

  it('should return NaN for non-numeric input', () => {
    expect(parseNumericInput('abc')).toBeNaN();
  });

  it('should return NaN for empty string', () => {
    expect(parseNumericInput('')).toBeNaN();
  });

  it('should parse leading numbers from mixed input', () => {
    // parseFloat behavior: reads until it can't parse more
    expect(parseNumericInput('123abc')).toBe(123);
  });

  it('should handle negative numbers', () => {
    expect(parseNumericInput('-5.5')).toBe(-5.5);
  });

  it('should handle whitespace-padded input', () => {
    // parseFloat trims leading whitespace
    expect(parseNumericInput('  100  ')).toBe(100);
  });
});
