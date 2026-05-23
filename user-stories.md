# Meal Tracker — User Stories

Stories derived from [PRD.md](PRD.md). Each card is self-contained: drop the title into Trello as the card title, and paste the body as the description. Acceptance criteria are plain bullets a tester or developer can check off.

---

## US-01 — Log in with email and password

**As a** returning user
**I want to** log in with my email and password
**So that** I can access my personal food log and preferences.

**Acceptance criteria**

- Valid email and password redirects the user to the dashboard.
- Incorrect email or password shows an error message; the user stays on the login page.
- The session persists across browser restarts for 7 days.
- Navigating directly to a protected page (e.g. `/dashboard`) while logged out redirects to the login page.

**Notes for QA:** three demo accounts exist — Alice, Bob, Carol (all `password123`). Use `alice@carvedrock.com` for generic flows.

---

## US-02 — Set my dietary preferences

**As a** user
**I want to** set my calorie target, goal, allergies, and unit system
**So that** the app can tailor feedback and filtering to me.

**Acceptance criteria**

- Calorie target accepts any positive integer and is reflected on the dashboard from the next visit.
- Selected allergies (e.g. *dairy*, *nuts*) cause foods tagged with those allergens to be excluded from the food browser.
- Switching the unit system (metric ↔ imperial) updates displayed weights across the app.
- Changing the locale updates number formatting across the app (decimal separator).
- Preferences persist across sessions.

---

## US-03 — Browse the food database filtered by my allergies

**As a** user with food allergies
**I want to** see only foods that are safe for me
**So that** I don't accidentally log a food containing an allergen.

**Acceptance criteria**

- Foods tagged with any of the user's allergens are hidden from the list.
- Foods whose ingredient list mentions an allergen the user is allergic to are hidden, even when the allergen is not present in the food's tags.
- A user with no listed allergies sees the full database.
- Search results respect the allergen filter.
- The filter applies everywhere the user can pick a food — including the log page, not just the foods page.

---

## US-04 — Add a new food to the database

**As a** user
**I want to** add foods that aren't in the default database
**So that** I can log meals the app doesn't already know about.

**Acceptance criteria**

- The form captures name, calories, macros (protein/carbs/fat), sugar, fiber, ingredients, allergens, and category.
- Required fields must be populated; the form shows which field is missing on a failed submit.
- A duplicate food name surfaces a clear error.
- Numeric fields reject negative values and non-numeric input before submission.
- A newly added food appears in the food list for the creating user immediately.

---

## US-05 — Edit a food I created

**As a** user
**I want to** edit foods I created
**So that** I can correct mistakes without deleting and re-adding.

**Acceptance criteria**

- The Edit action is available only for foods the user created.
- Edit opens a form pre-filled with the current values.
- Saving updates the food and the change is visible in the food list on refresh.
- System foods and foods created by other users cannot be edited; the API returns 403 for any attempt.
- Historical log entries that reference this food keep the calorie/macro values from the time of logging — they do not change retroactively when the food is edited. *(see also: BUG-07 Ghost Meal)*

---

## US-06 — Log a food entry

**As a** user
**I want to** log foods I've eaten with a grams amount and a meal type
**So that** my dashboard accurately reflects my day.

**Acceptance criteria**

- Selecting a food, entering a positive grams value, choosing a meal type, and submitting saves the entry and it appears under that meal on the dashboard.
- Non-positive grams values (zero, negative, empty) are rejected both in the UI and at the API.
- The entry can be logged for any date (past or today); past entries show up in the history view for that date.
- Deleting an individual entry or using *Clear Today* updates the dashboard totals immediately without a full reload.

---

## US-07 — See today's dashboard

**As a** user
**I want to** see a clear summary of today's calories, macros, and daily feedback
**So that** I know how I'm tracking against my goals.

**Acceptance criteria**

- The dashboard shows total calories consumed, calories remaining, and progress toward the daily target.
- Macros (protein / carbs / fat) are shown as both absolute grams and percentage of total calories.
- The daily feedback message uses green tone when the day is within ±10% of the calorie target and macros fall within the balanced ranges (Protein 20–35%, Carbs 40–60%, Fat 20–35%).
- The feedback uses an amber tone when exactly one of the two conditions is met, and a neutral tone when neither is met.
- Entries are grouped by meal type (breakfast, lunch, dinner, snack) with per-meal calorie subtotals.

---

## US-08 — Balanced-day feedback

**As a** user
**I want to** receive meaningful feedback about whether my day was nutritious
**So that** I can adjust tomorrow's choices.

**Acceptance criteria**

- Feedback considers total calories consumed, not only macro ratios.
- Feedback considers the *quality* of carbs — for example, a day whose carbs are overwhelmingly refined sugar should not be labeled "balanced" regardless of macro percentages.
- Feedback is conveyed with text and/or an icon in addition to color (WCAG 1.4.1 — color alone is not sufficient).
- The feedback message is readable by a screen reader.

**Notes for QA:** this story is intentionally broader than PRD §4.6 — §4.6 describes only the macro-percentage check. BUG-01 and BUG-02 surface why that's not enough.

---

## US-09 — Review my 30-day history

**As a** user
**I want to** see daily summaries for the past 30 days
**So that** I can spot trends in my eating.

**Acceptance criteria**

- Each day shown includes: total calories, macro summary (g and %), entry count, feedback message, and a status indicator.
- Tapping a day opens the detailed dashboard view for that date.
- The status indicator is conveyed in a form that does not rely on color alone.
- Days with no logged entries are shown as "no entries" rather than "zero calories."
- The list is ordered most-recent first.

---

## US-10 — View allergen reference

**As a** user
**I want to** see which foods contain each allergen category
**So that** I understand what the app is filtering on my behalf.

**Acceptance criteria**

- The allergens page lists each allergen category together with the foods tagged for it.
- The count of foods per allergen category is shown.
- Foods excluded from the user's own view by their allergy settings still appear in this reference view.
- The allergen list matches the authoritative set: gluten, dairy, nuts, soy, eggs, shellfish, fish.

---

## US-11 — Consistent units, dates, and numbers across the app

**As a** user
**I want** weights, dates, and decimal numbers displayed consistently wherever they appear
**So that** I can trust the numbers I see and enter.

**Acceptance criteria**

- When the user's unit system is *imperial*, every page that displays a weight shows it in ounces or pounds — consistently, not just on some pages.
- Dates are displayed in MM/DD/YYYY format on every page (dashboard, log, foods, history, allergens).
- Numeric inputs accept the locale's decimal separator — e.g. typing `1,5` in a comma-decimal locale is parsed as 1.5, not silently truncated to 1.
- Dashboard, log, foods, history, and allergens pages all respect the same unit and locale settings.
