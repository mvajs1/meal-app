// FoodLog.date is stored as DateTime but semantically represents a calendar day.
// We normalize every stored value to UTC midnight and serialize as YYYY-MM-DD
// so the API contract and UI (which use plain date strings) stay unchanged.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toDateOnlyUTC(input: string): Date {
  if (!ISO_DATE.test(input)) {
    throw new Error(`Invalid date: expected YYYY-MM-DD, got "${input}"`);
  }
  return new Date(`${input}T00:00:00.000Z`);
}

export function fromDateOnlyUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}
