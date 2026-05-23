/**
 * Unit conversion and formatting utilities.
 * NOTE: Contains intentional inconsistencies for QA teaching (Flaw 9).
 */

const GRAMS_PER_OUNCE = 28.3495;

export function gramsToOunces(grams: number): number {
  return grams / GRAMS_PER_OUNCE;
}

export function ouncesToGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}

/**
 * Format weight with appropriate unit.
 */
export function formatWeight(grams: number, unitSystem: string): string {
  if (unitSystem === 'imperial') {
    const oz = gramsToOunces(grams);
    return `${oz.toFixed(1)} oz`;
  }
  return `${Math.round(grams)} g`;
}

/**
 * Format a date for display.
 * NOTE: This function exists but is NOT consistently used across all pages (Flaw 9).
 * Some components call this, others use raw toLocaleDateString() or hardcoded formats.
 */
export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Parse numeric input from a string.
 * NOTE: Always uses parseFloat — ignores locale-specific decimal separators (Flaw 9).
 * Input like "1.500,5" (German format for 1500.5) will parse as 1.5.
 */
export function parseNumericInput(input: string): number {
  return parseFloat(input);
}
