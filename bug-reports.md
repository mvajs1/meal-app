# Meal Tracker — Bug Reports

Nine bug reports covering the app's known flaws, written as if filed by a QA who discovered each symptom during testing (i.e., no insider knowledge of which file is at fault). Use them as:

- **Trello cards** — copy title + body into a ticket
- **Prompt inputs** — paste one into AI when asking for a failing unit test, a UI test that catches it, or a code review of a fix

Severity scale used throughout:
- **Critical** — can harm a user (safety, health, privacy, data loss)
- **High** — wrong business-rule output; primary flow broken
- **Medium** — UX degradation; secondary flow broken
- **Low** — cosmetic or developer-facing only

---

## BUG-01 — Dashboard calls a ~130-kcal day "balanced"

**Severity:** High
**Related user story:** US-07, US-08

**Description**
The dashboard reports a day as "balanced" and "on track" when total calories consumed are far below the user's target, as long as the macro percentages happen to sit in the balanced ranges. A user trying to follow the app's feedback is told they're doing fine on a day that is nutritionally a disaster.

**Steps to reproduce**
1. Log in as Alice (calorie target 2,000 kcal).
2. Clear today's entries.
3. Log: 240 g black coffee (breakfast), 20 g peanut butter (lunch), 10 g oatmeal (breakfast).
4. Open the dashboard.

**Expected**
A day totaling ~130 kcal against a 2,000 kcal target should not be presented as balanced or on track. At a minimum, the balanced-day feedback should factor in total calories, not only macro percentages.

**Actual**
Dashboard shows green feedback: "Perfect day! Your nutrition is balanced and within your calorie target. Keep this up!"

**Impact**
A user who takes the feedback at face value (the whole point of the feature) would systematically under-eat on days the app rewards.

---

## BUG-02 — Day is "balanced" when 100% of carbs come from refined sugar

**Severity:** High
**Related user story:** US-08

**Description**
The balanced-day feedback doesn't distinguish between wholesome and refined carbohydrates. Sugar is tracked per food but never consulted by the feedback logic. A day whose carbs are entirely from candy receives the same positive feedback as a day based on whole grains.

**Steps to reproduce**
1. Log in as Alice.
2. Clear today's entries.
3. Log: 200 g chicken breast (lunch), 30 g gummy bears (snack), 15 g olive oil (lunch).
4. Open the dashboard.

**Expected**
The feedback should consider carb quality. A day where carbs are dominated by refined sugar should not be labeled "balanced" regardless of macro percentages.

**Actual**
Dashboard shows green feedback: the day is reported as balanced.

**Impact**
Users following the feedback would consider a candy-for-lunch day nutritionally equivalent to a whole-food day.

---

## BUG-03 — Dead code: `checkRepetition` is exported and tested but never called

**Severity:** Low *(code quality / maintenance)*
**Related user story:** none — the function implements a feature the PRD places out of scope (§9 "Weekly meal planning")

**Description**
`lib/utils/validators.ts` exports `checkRepetition`, a function that flags meals appearing more than twice in a week. It has unit tests that all pass. It is never called from any page, API route, or service. It appears to implement a "meal variety warning" feature that is not delivered in the UI and is listed as out of scope in the PRD.

Two issues follow from this:

1. **Unreachable code.** The function adds maintenance surface — future refactors have to consider it, it appears in coverage reports, and a new engineer reading the codebase can reasonably assume it is wired in somewhere.
2. **Latent bug if revived.** If someone does wire it up later, the implementation compares meals by *name only*, not by content. Two logged entries with the same ingredients but different names ("Monday Special" vs "Tuesday Special") would not trigger the check. When the feature is eventually built, the contract it promises won't match user intent.

**Steps to reproduce**
```bash
grep -rn "checkRepetition" app/ lib/ --include="*.ts" --include="*.tsx"
```
The only match is the export itself.

**Expected**
Either (a) delete the function and its tests, or (b) wire it into a user-facing flow with a content-based comparison.

**Actual**
Function lives in the codebase indefinitely, protected by its passing tests.

**Impact**
Low for users (no visible effect). Moderate for the team: passing tests imply functionality that doesn't exist — the kind of false signal that erodes trust in the suite.

**Teaching value:** a good example of why "tests green" is not the same as "feature shipped." AI assistants asked to generate tests for a function will do so without checking whether the function is ever called.

---

## BUG-04 — Allergen filter misses allergens listed in ingredient text

**Severity:** Critical *(safety)*
**Related user story:** US-03, US-10

**Description**
The allergen filter matches only on the allergen tags attached to each food. It does not read the free-text ingredient list. Several foods in the default database have ingredient text that mentions an allergen not present in the tags — so a user with that allergy sees them as "safe."

**Examples observed in the seeded data**

| Food | Ingredients mention | Allergen tags say | Missing from tags |
|---|---|---|---|
| Caesar Dressing | anchovies, egg yolk | dairy | fish, eggs |
| Protein Bar | soy lecithin | dairy | soy |
| Granola Bar | milk powder, wheat flour | nuts | dairy, gluten |
| Chocolate Chip Cookies | butter, eggs | gluten | dairy, eggs |

**Steps to reproduce**
1. Log in as Bob (allergies: gluten, dairy).
2. Open the foods page.
3. Search for "Granola Bar".

**Expected**
Granola Bar should not appear — its ingredient list contains milk powder and wheat flour. Bob should be protected from both of his allergens.

**Actual**
Granola Bar appears and is selectable for logging.

**Impact**
A user with a fish or egg allergy could serve themselves Caesar Dressing, believing the filter had vetted it. This is a safety-critical failure in a feature explicitly marketed as allergy-protective (PRD §2, §4.3).

---

## BUG-05 — Weekly calorie drift is invisible

**Severity:** High
**Related user story:** US-07

**Description**
The calorie-target check compares each day's total to the user's daily target within ±10%, so a user who's slightly over every day sees green every day. There's no weekly rollup, so a drift of ~10% × 7 days (close to a full day's surplus over a week) is invisible.

**Steps to reproduce**
1. Log in as Alice (target 2,000 kcal).
2. For each of the last 7 days, log entries totaling ~2,180 kcal.
3. Open history.

**Expected**
Some indication that week-over-week, the user is consistently above target by a margin that will lead to weight gain over time. At least a weekly aggregate; ideally a trend indicator.

**Actual**
All seven days are green. No weekly summary exists. The drift (~1,260 kcal over the week — roughly half a day's surplus) is not surfaced anywhere in the UI.

**Impact**
Users relying on the feedback to manage weight cannot detect small, steady drift — the most common real-world failure mode.

---

## BUG-06 — Negative grams accepted; totals can be driven down

**Severity:** High
**Related user story:** US-06

**Description**
Although the log form's grams input has a `min="1"` attribute, the backing API accepts negative values. A negative log entry produces negative calories and macros, which reduce the day's totals.

**Steps to reproduce**
1. Log in as Alice. Log a normal meal (any positive-kcal entry).
2. From the browser dev tools or `curl`, POST to `/api/food-log` with a body like `{ "foodId": 1, "grams": -200, "mealType": "lunch", "date": "<today>" }`.
3. Reload the dashboard.

**Expected**
The API should reject non-positive `grams` with a 4xx response. The UI should never allow this, but the API must enforce the same rule since it is also a public surface.

**Actual**
The entry is saved. The dashboard subtracts the computed calories from today's total; macros go down accordingly.

**Impact**
Any user with API access (or dev tools) can cheat their own tracker. More importantly, this is a classic class of input-validation bug that could cascade in unexpected ways.

---

## BUG-07 — Editing a food retroactively changes past log entries

**Severity:** High
**Related user story:** US-05, US-09

**Description**
Food logs store a reference to the food, not a snapshot of its nutrition at log time. When a food is edited — its calories, protein, etc. are changed — every existing log that references it silently recomputes against the new values. A user looking at last week's history sees different totals than they did at the time.

**Steps to reproduce**
1. Log in as Alice. Create a user food "Custom Sandwich" at 400 kcal / 100 g.
2. Log 100 g "Custom Sandwich" for today's lunch. Dashboard shows +400 kcal for that entry.
3. Navigate to the foods page and edit "Custom Sandwich" — change calories to 800 / 100 g. Save.
4. Return to the dashboard.

**Expected**
The already-logged entry reflects what was true when it was logged. Historical records should be immutable with respect to food edits.

**Actual**
The dashboard entry now reads 800 kcal. The day's totals, feedback, and history view all shift retroactively.

**Impact**
Users lose trust in historical data. In a regulated or audited context (insurance, medical, coaching), this would be a data-integrity red flag.

---

## BUG-08 — Status indicators are color-only; not accessible

**Severity:** High *(accessibility)*
**Related user story:** US-07, US-08, US-09, PRD §10

**Description**
Several places convey state *only* through color. There is no text equivalent, no icon, no aria-label. Users with colorblindness or using a screen reader cannot determine the state.

**Observed**
1. **Balanced badge** (appears in various places where a food or day is described) — a colored dot, green or red, with no adjacent text and no accessible name.
2. **Dashboard daily-feedback card** — background color (emerald / amber / slate) conveys status; text is encouraging regardless.
3. **History list status dot** — same pattern as (1).
4. **Login page** — the email input has only a placeholder, no associated `<label>`.

**Steps to reproduce**
1. Open Chrome DevTools → Rendering → Emulate vision deficiencies → *Achromatopsia*.
2. Navigate to the dashboard and to the history page. Observe that status indicators are visually indistinguishable.
3. With a screen reader on (VoiceOver / NVDA), navigate the login form and the dashboard feedback card.

**Expected**
Status is conveyed by a combination of color + text/icon; every form input has an associated label; every interactive component has an accessible name. PRD §10 targets WCAG 2.1 AA.

**Actual**
Color alone is the signal in the places above; the login email input has no label; the balanced badge has no accessible name.

**Impact**
~8% of male users are red-green color-deficient. Screen-reader users cannot complete the primary flows.

---

## BUG-09 — Units and date formatting inconsistent across pages

**Severity:** Medium *(higher for non-en-US users)*
**Related user story:** US-11

**Description**
User preferences for unit system (metric vs imperial) are honored in some places and ignored in others. Date formatting is similarly inconsistent across pages even though the PRD mandates MM/DD/YYYY everywhere. The app ships a formatter helper for weights, but not every page uses it.

**Observed**

1. **Imperial user** (e.g., Bob) sees grams on the foods page; grams in the log form; grams on the dashboard entry rows. Nothing converts to ounces.
2. **Inconsistent date format.** Some pages render dates as `5/11/2026`, others as `May 11, 2026`, others as the raw ISO string `2026-05-11`. None of the pages consistently show the MM/DD/YYYY format the PRD requires (§11).
3. **Decimal separator.** A user in a locale that uses `,` as decimal (de-DE, fr-FR, etc.) typing `1,5` into a grams input has that parsed as `1`, silently — the form accepts and stores the wrong value.

**Steps to reproduce** (for 1)
1. Log in as Bob.
2. Visit `/foods`, `/log`, `/dashboard`, `/history` in sequence.
3. Observe the unit labels on each page.

**Expected**
Units display consistently across all pages per the user's unit preference. Dates always display as MM/DD/YYYY on every page. Numeric inputs accept the locale's decimal separator.

**Actual**
Inconsistent behavior as listed.

**Impact**
Users see an app that feels half-finished and can silently store wrong values.
