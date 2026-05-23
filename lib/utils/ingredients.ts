// Parse a free-form ingredient list into a de-duplicated, normalized array.
// Accepts either a comma-separated string (seed / API form input) or an array
// already split by the caller. Order is preserved.
export function parseIngredients(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : input.split(',');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw) {
    const name = piece.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}
