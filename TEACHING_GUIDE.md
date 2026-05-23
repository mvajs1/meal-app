# Meal Tracker — Teaching Guide

**INSTRUCTOR ONLY** — Do not share with students before the teaching sessions.

---

## App Description & Main Flows

**Meal Tracker** is a daily food logging web app where users:
1. Log in with email/password
2. Browse a database of 50+ foods with full nutritional data
3. Log foods they eat throughout the day (breakfast, lunch, dinner, snack)
4. See real-time macro and calorie tracking on their dashboard
5. Get automated personalized feedback: balanced badge, calorie target check, macro breakdown
6. Review their eating history over the past 30 days
7. Manage their profile: calorie target, dietary goal, allergies, preferred units

**Main User Flows:**

| Flow | Steps | Key Screens |
|------|-------|-------------|
| **Onboarding** | Login → Set preferences (goal, allergies, calorie target, unit system) | Login, Dashboard |
| **Browse Foods** | View all foods → Search/filter → Click to expand nutritional detail → Add new food → Edit existing food | Foods page |
| **Check Allergens** | View allergen categories → See which foods contain each allergen | Allergens page |
| **Log Food** | Tap "+" on a meal type → Search food → Set grams → Add to log | Log page |
| **Track Today** | View dashboard → See calorie progress bar → Check macro bars → Read daily feedback | Dashboard |
| **Review History** | View past 30 days → See daily summaries with feedback → Color-coded status | History page |
| **Edit Preferences** | Change calorie target, goal, allergies, unit system | Dashboard |

**The app looks and feels like a production food tracker.** All flows work. All tests pass. The intentional flaws are invisible to casual use — they require thoughtful QA analysis to discover.

---

## Overview

This app is a **realistic but intentionally flawed** food tracker. It ships as a working app with hidden flaws. Students discover the flaws, then use AI-assisted techniques to fix them — learning both the power and limitations of Gen AI in QA.

---

## The Teaching Pattern: Generate → Review → Gap

Every AI-assisted exercise in this guide follows the same three-beat rhythm. State it explicitly to students on day one and keep returning to it.

1. **Generate.** Ask AI to produce the artifact (a test strategy, test cases, a bug report, a unit test, a code review…). Use a realistic short prompt — not a 40-line rubric. The point is to see what AI does with a prompt someone would actually send.
2. **Review.** Read the output critically with the class. Does it look thorough? Does it name the right things? Does it cite the PRD or user story, or does it invent its own?
3. **Gap.** What's missing, wrong, or misleading? Name the class of failure (domain knowledge, questioning requirements, cross-cutting consistency, severity calibration…). This is the teaching beat — the reason you ran the exercise.

Do *not* show a "perfect" prompt first and declare victory. The teaching value is watching AI underperform on a reasonable prompt, then reasoning about where the human has to step in. Every LO below maps to this pattern.

---

## Companion Artifacts

These files live alongside this guide and are referenced in the lesson flow:

- [PRD.md](../PRD.md) — the spec. Used only as input to Test Strategy and Test Cases.
- [user-stories.md](../user-stories.md) — 11 Trello-ready user stories derived from the PRD. Used as input to test case generation, automated test generation (unit/API/UI/perf), and code review. Pre-load these into a Trello board before Session 1.
- [bug-reports.md](../bug-reports.md) — 9 bug reports, one per intentional flaw, written from a QA's perspective (no insider code knowledge). Used as input to failing-test generation and to code-review-of-a-fix exercises. Also useful as a hidden answer key — don't share with students before the relevant session.
- [prompts.md](../prompts.md) — paired Basic / Teacher prompts for each QA task. Short, realistic, and all using the Generate → Review → Gap frame.
- [steps.md](../steps.md) — minute-by-minute teacher demo scripts, one per task. Standalone or run in sequence.

---

## What Ships Pre-Built vs. Built During Teaching

The app has two layers:

**PRE-BUILT (ship with the app — students explore these):**
- Full working app: auth, dashboard, food logging, foods, allergens, history
- Intentional flaws embedded in code and data
- Existing unit tests that all PASS (intentional gaps in test coverage)
- PRD.md (the "spec" students can reference)
- CI/CD pipeline (`.github/workflows/test.yml`)
- PR template + bug report template

**BUILT DURING TEACHING (instructor live-codes with AI assistance):**
- Fixing flaws (students write failing tests first, then fix)
- New test types: integration tests, API tests, E2E tests
- Accessibility audit + fixes
- Localization fixes
- Code review improvements
- Quality dashboard / coverage reports
- Bug triage and defect documentation

This split is critical: the pre-built app gives students a realistic codebase to analyze. The teaching sessions use AI to extend/fix it, demonstrating both AI capabilities and limitations.

---

## Learning Objectives Mapping

### LO1: Gen AI for Test Strategy and Test Planning

| Exercise | Where in App | Pre-built or Live? |
|----------|-------------|-------------------|
| **"AI Test Strategy Audit"**: Give AI the PRD.md and ask it to generate a test strategy. Compare what it produces vs. the actual flaws. | PRD.md, full app | Student exercise |
| **"Risk-Based Testing"**: Ask AI to identify highest-risk areas from the codebase. Does it flag `checkBalanced()` as high-risk? Does it notice the allergen data inconsistency? | `lib/utils/calculations.ts`, `prisma/seed.ts` | Student exercise |
| **"Coverage Analysis"**: Ask AI to analyze existing tests and identify gaps. It will find some (e.g., no negative grams test) but miss others (no cross-page consistency test). | `tests/*.test.ts` | Student exercise |
| **Discussion**: AI generates test strategies from code structure and specs. It misses: domain knowledge (nutrition science), data quality concerns, cross-functional flows, organizational context (who are the users? what's the real risk of a wrong "Balanced" feedback?). | — | Discussion |

**Key teaching point (LO1):** AI is excellent at generating test matrices from requirements. It's poor at questioning whether the requirements themselves are complete. Show students: AI won't flag "Open Questions: None" as suspicious — a human QA would.

*Relevant flaws: 1, 2, 4, 5 (all stem from incomplete requirements that AI wouldn't question)*

### LO2: AI-Assisted Test Case Generation and Automation

| Exercise | Where in App | Pre-built or Live? |
|----------|-------------|-------------------|
| **"Generate Unit Tests"**: Ask AI to generate tests for `checkBalanced()`, `filterAllergens()`. Run them — they all pass. Then reveal the flaws. | `lib/utils/calculations.ts`, `lib/utils/validators.ts` | Student exercise |
| **"Generate API Tests"**: Use AI to generate REST API tests for `/api/foods`, `/api/food-log`. AI generates thorough happy-path + error tests. | `app/api/` routes | **Live-code during teaching** |
| **"Fuzz Testing"**: Use AI to generate fuzz inputs for the gram field (negative, zero, huge numbers, strings, NaN). Discover Flaw 6. | Log page, `scaleNutrition()` | **Live-code during teaching** |
| **"E2E Test Writing"**: Use AI to write a Playwright test for the full flow: login → log food → check dashboard → review history. | Full app flow | **Live-code during teaching** |
| **"CI/CD Integration"**: Add AI-generated tests to the pipeline. Review: are they maintainable? Do they add real value or just coverage numbers? | `.github/workflows/test.yml` | **Live-code during teaching** |

**Key teaching point (LO2):** AI generates excellent boilerplate tests. It excels at boundary values, type checking, and error handling. It fails at: questioning business logic correctness, testing cross-page state, and generating tests that validate intent vs. implementation.

*Relevant flaws: 6 (AI CAN find), 1-2 (AI generates tests that pass for wrong behavior)*

### LO3: Gen AI for Code Review and Static Analysis

| Exercise | Where in App | Pre-built or Live? |
|----------|-------------|-------------------|
| **"AI Code Review"**: Submit `calculations.ts` to an AI code review tool. What does it flag? (Likely: missing input validation, no JSDoc). What does it miss? (The balanced logic is semantically wrong but syntactically clean). | `lib/utils/calculations.ts` | Student exercise |
| **"PR Review Simulation"**: Student fixes Flaw 6 (negative grams), opens a PR using the template. AI reviews the PR. Evaluate: did AI catch everything? Did it miss the need to also fix the UI input? | `.github/PULL_REQUEST_TEMPLATE.md` | **Live-code during teaching** |
| **"Static Analysis"**: Use AI to scan for anti-patterns, security issues (is the auth token scheme secure enough?), code smells (magic numbers in balanced ranges). | Full codebase | Student exercise |
| **Discussion**: AI code review catches syntactic issues reliably. It misses semantic correctness, business rule violations, and architectural problems. Best practice: AI as first-pass reviewer, human for business logic and architectural concerns. | — | Discussion |

**Key teaching point (LO3):** AI code review is like a very thorough junior reviewer — catches style issues, potential null references, missing error handling. But it doesn't understand the business domain. The `checkBalanced()` function is clean, well-structured code — AI would approve it. A human QA with nutrition knowledge would question it.

*Relevant flaws: 6 (AI CAN flag missing validation), 8 (AI CAN flag missing aria-labels if prompted), 1-2 (AI misses business logic issues)*

### LO4: Gen AI for Bug Triage, Defect Management & Non-Functional Testing

| Exercise | Where in App | Pre-built or Live? |
|----------|-------------|-------------------|
| **"Bug Report with AI"**: Students discover a flaw, then use AI to write a structured bug report using the issue template. AI helps with: severity assessment, reproduction steps, categorization. | `.github/ISSUE_TEMPLATE/bug_report.md` | Student exercise |
| **"Duplicate Detection"**: Students file bug reports for discovered flaws. Use AI to identify if any are duplicates or related (Flaws 1 & 2 share the same root cause in `checkBalanced()`). | — | Student exercise |
| **"Accessibility Audit"**: Use AI to generate an accessibility checklist from WCAG 2.1 AA. Run the checklist against the app. AI identifies: missing labels (Flaw 8), color-only indicators (Flaw 8), keyboard nav issues. | Full app UI | **Live-code during teaching** |
| **"Accessibility Fix"**: Use AI to generate fixes for the a11y issues. Add aria-labels, text alternatives, keyboard handlers. | `BalancedBadge.tsx`, `MacroChart.tsx`, `login/page.tsx` | **Live-code during teaching** |
| **"Localization Testing"**: Use AI to generate test cases for i18n: date formats across locales, decimal separators, unit display consistency. Discover Flaw 9. | `lib/utils/unitConversion.ts`, various pages | **Live-code during teaching** |
| **"Localization Fix"**: Use AI to fix the inconsistent unit conversion and date formatting across pages. | `unitConversion.ts`, component files | **Live-code during teaching** |

**Key teaching point (LO4):** AI is strong at accessibility auditing (rule-based, well-documented standards) and bug report structuring. It's weaker at severity assessment (doesn't understand user impact) and localization nuance (cultural date expectations). For allergen Flaw 4, AI can generate a severity assessment but won't flag it as "critical/safety" unless you tell it this is a health app.

*Relevant flaws: 8 (AI is good at a11y), 9 (AI is decent at i18n), 4 (AI underestimates severity without domain context)*

### LO5: Gen AI for Testing Documentation and Quality Reporting

| Exercise | Where in App | Pre-built or Live? |
|----------|-------------|-------------------|
| **"Test Documentation"**: Use AI to generate test case descriptions for existing tests. Evaluate: are they accurate? Do they describe what the test validates or just what it does? | `tests/*.test.ts` | Student exercise |
| **"Test Result Summary"**: After running tests, use AI to generate a human-readable test report from vitest output. | `npm test` output | Student exercise |
| **"Quality Dashboard"**: Use AI to propose and build a simple `/reports` page showing: test pass rate, flaw coverage map, foods-without-complete-allergens count. | New page | **Live-code during teaching** |
| **"Coverage Report"**: Use AI to analyze vitest coverage output and generate a narrative report: what's well-tested, what's not, what matters most. | vitest `--coverage` | **Live-code during teaching** |
| **"Retrospective Summary"**: After all sessions, use AI to generate a QA retrospective: what was found, what was fixed, what's still at risk. Students validate and edit. | — | Student exercise |
| **Discussion**: AI generates polished documentation fast. Risk: teams accept AI output without validation. Exercise: find a factual error in an AI-generated test report. Emphasize: human accountability for all published QA artifacts. | — | Discussion |

**Key teaching point (LO5):** AI dramatically accelerates documentation. The danger is "looks right, isn't right." AI might describe a test as "validates nutritional balance" when the test actually only validates that the function returns a boolean. Students learn to verify AI documentation against actual behavior.

---

## Recommended Teaching Strategy (5 Sessions)

### Session 1: "Everything Looks Fine" — LO1 focus (2 hours)

**Goal**: Students experience the app as users, then discover it's flawed despite passing tests.

1. **Setup** (15 min): Students clone repo, run `npm install && npm run dev`, verify app works
2. **Exploration** (30 min): Login as Alice, log some foods, check dashboard feedback. "Is this app working correctly?"
3. **AI Test Strategy** (30 min): Give AI the PRD.md. Ask it to generate a test strategy + test plan. Review what it produces.
4. **Discovery** (30 min): Guided hints lead students to Flaws 1 & 2. "Try logging only coffee and a protein bar." "Try making all your carbs from candy."
5. **Discussion** (15 min): Compare AI's test strategy vs. what they actually found. What did AI miss? Why?

**Flaws revealed**: 1 (Fake Healthy Day), 2 (All Sugar Carbs)

### Session 2: "AI-Assisted Test Generation" — LO2 focus (2-3 hours)

**Goal**: Students use AI to generate tests, then discover its blind spots.

1. **AI Test Generation** (45 min): Students use AI to generate unit tests for `calculations.ts` and `validators.ts`. Run them — all pass.
2. **The Challenge** (30 min): "Find a behavior that your AI tests didn't cover." Introduce Flaws 5, 6.
3. **Failing Test First** (45 min): Students write tests that SHOULD fail (negative grams, weekly calorie drift). Run them — they fail. This is correct TDD.
4. **Live-code: API Tests** (30 min): Instructor uses AI to generate API tests for `/api/foods` and `/api/food-log`. Integrate into CI pipeline.
5. **Discussion** (15 min): What can AI test well? What requires human judgment?

**Flaws revealed**: 5 (Weekly Drift), 6 (Negative Grams)

### Session 3: "The Data Lies + Code Review" — LO3 + LO4 focus (2-3 hours)

**Goal**: Students learn that correct code + wrong data = wrong system. Practice AI-assisted code review.

1. **AI Code Review** (30 min): Submit `calculations.ts` and `validators.ts` to AI review. What does it flag? What does it miss?
2. **Data Discovery** (30 min): Login as Bob (dairy allergy). "Is every food shown safe?" Cross-reference ingredients vs allergen tags. Reveal Flaw 4.
3. **Bug Filing** (30 min): Students file bug reports using the issue template. Use AI to help with severity assessment. Discuss: AI rated Flaw 4 as "medium" but it's actually safety-critical.
4. **PR Simulation** (30 min): Student fixes Flaw 6, opens PR with template. AI reviews. Class evaluates AI's review.
5. **Live-code: Accessibility Audit** (30 min): Use AI to run WCAG 2.1 checklist against the app. Discover Flaw 8. Begin fixes.
6. **Discussion** (15 min): Code review quality — AI as first pass, human for business context.

**Flaws revealed**: 4 (Allergen Blind Spot), 8 (Color-Blind Confusion)

### Session 4: "Non-Functional & Cross-Cutting" — LO4 continued (2-3 hours)

**Goal**: Accessibility fixes, localization testing.

1. **Live-code: A11y Fixes** (45 min): Use AI to generate fixes for Flaw 8 — aria-labels, text alternatives, keyboard navigation. Verify with screen reader.
2. **Localization Testing** (30 min): Use AI to generate i18n test cases. Switch user to imperial/German locale. Discover Flaw 9.
3. **Live-code: i18n Fixes** (30 min): Fix unit conversion inconsistencies and date formatting. Use AI to identify all affected components.
4. **Discussion** (15 min): Non-functional testing requires different thinking. AI is good at rule-based checks (a11y) but struggles with state consistency across views.

**Flaws revealed**: 9 (Lost in Translation)

### Session 5: "Fix It + Document It" — LO2 + LO5 focus (2-3 hours)

**Goal**: Students fix remaining flaws using TDD, document everything, build quality reporting.

1. **TDD Fix Session** (60 min): Each student/pair picks 1-2 unfixed flaws. Write failing test → implement fix → verify test passes. Use AI to assist with implementation.
2. **Live-code: Quality Dashboard** (30 min): Use AI to build a simple `/reports` page showing test results, coverage gaps, known issues.
3. **Documentation** (30 min): Use AI to generate test documentation and retrospective summary. Students review and correct AI output.
4. **Final Discussion** (30 min):
   - "Tests verify implementation, not intent."
   - "AI is great at generating tests for what code does. It's bad at questioning whether code should do that."
   - "QA reasoning = domain knowledge + skepticism + system thinking."
   - "Data quality is as important as code quality."
   - "The best bugs look like features."

**All flaws resolved. Students have practiced AI-assisted testing across all 5 LOs.**

---

## Flaw Catalog Quick Reference

| # | Name | Category | Difficulty | LO | Session |
|---|------|----------|------------|-----|---------|
| 1 | Fake Healthy Day | Domain Knowledge | Easy | LO1 | 1 |
| 2 | All Sugar Carbs | Semantic Understanding | Easy-Med | LO1 | 1 |
| 3 | Orphaned Variety-Check Code | Dead Code / Feature Gap | Medium | LO2,3 | 2 (bonus) |
| 4 | Allergen Blind Spot | Data Integrity | Med-Hard | LO3,4 | 3 |
| 5 | The Weekly Drift | System Thinking | Medium | LO2 | 2 |
| 6 | Negative Gram Entry | Input Validation | Easy | LO2,3 | 2 |
| 7 | Ghost Meal | Temporal / Data Integrity | Medium | LO3 | 3 (bonus) |
| 8 | Color-Blind Confusion | Accessibility | Medium | LO4 | 3-4 |
| 9 | Lost in Translation | Localization | Medium | LO4 | 4 |

---

## Flaw Catalog — Full Descriptions

Every flaw below is real, intentional, and reachable from the running app. Each entry names the file(s), a concrete reproduction a teacher can run live, and the teaching point.

### Flaw 1 — Fake Healthy Day

**Where:** [lib/utils/calculations.ts](../lib/utils/calculations.ts) — `checkBalanced()`

**What it is:** `checkBalanced()` looks only at macro *percentages* (protein 20–35%, carbs 40–60%, fat 20–35%). It never looks at total calories or food quality. Any tiny day whose macros happen to fall in those ranges is labeled **Balanced**.

**Repro:** log in as Alice, clear today's entries, and log only: 1 cup black coffee (2 kcal) + 20 g peanut butter (118 kcal) + 10 g oatmeal (7 kcal). Macros land inside the balanced ranges; dashboard says "Perfect day!" — at ~130 kcal on a 2,000-kcal target.

**Why AI won't find it:** the function is syntactically clean and tests pass. Only domain knowledge (a 130-kcal day is not healthy, regardless of ratios) surfaces this. The PRD §4.6 is literally wrong as written — a human QA has to question the spec.

---

### Flaw 2 — All Sugar Carbs

**Where:** [lib/utils/calculations.ts](../lib/utils/calculations.ts) — `checkBalanced()`

**What it is:** `checkBalanced()` also ignores carb *composition*. A carbs slot filled entirely by refined sugar is treated identically to one filled by whole grains. The `sugar` field is on every food but never read by the balance logic.

**Repro:** log 200 g Chicken Breast (protein) + 30 g Gummy Bears (carbs, 100% sugar) + 15 g Olive Oil (fat). Macro ratio fits the window; sugar is ~14 g from a 23-g carb total. Dashboard: "Balanced." PRD §4.6 says nothing about sugar ratio — this flaw lives in the *requirement*, not just the code.

**Teaching point:** pairs with Flaw 1. Both stem from an incomplete spec. AI that tests what the code does will happily call this Balanced forever.

---

### Flaw 3 — Orphaned Variety-Check Code

**Where:** [lib/utils/validators.ts](../lib/utils/validators.ts) — `checkRepetition()` (plus its tests in [tests/mealPlanner.test.ts](../tests/mealPlanner.test.ts))

**What it is:** `checkRepetition()` is exported, unit-tested, and never called from any page, API route, or service. It appears designed for a meal-variety warning — a feature the PRD explicitly places out of scope (§9 "Weekly meal planning"). The codebase ships tests for a feature that doesn't exist.

Two overlapping concerns:

1. **Unreachable code.** Maintenance surface with no corresponding user value. Future refactors have to reason about it.
2. **Latent design bug.** If someone later wires the function up, the implementation compares meals by *name* rather than by content. Two logged entries with different names but identical ingredients would bypass the check — likely not what users intend.

**Repro / live demo:**
```bash
grep -rn "checkRepetition" app/ lib/ --include="*.ts" --include="*.tsx"
```
Only the export itself matches. No call sites. In class, ask AI: "Is `checkRepetition` actually used?" — then run the grep and compare AI's answer to the truth.

**Teaching point:** passing tests are not evidence of a shipping feature. AI will generate unit tests for any function you point at, whether or not the function is ever executed in the running app. Coverage reports will show the function as "covered." The blind spot is structural, not statistical.

---

### Flaw 4 — Allergen Blind Spot

**Where:** [prisma/seed.ts](../prisma/seed.ts) lines 73–102, and [lib/utils/validators.ts](../lib/utils/validators.ts) — `filterAllergens()`

**What it is:** the allergen filter reads the `allergens` list, never the `ingredients` text. Four seed foods have ingredient text that mentions an allergen *not* listed in their allergen flags:

| Food | Ingredients mention | Allergen flags say | Missing |
|---|---|---|---|
| Caesar Dressing | anchovies, egg yolk | dairy | fish, eggs |
| Protein Bar | soy lecithin | dairy | soy |
| Granola Bar | milk powder, wheat flour | nuts | dairy, gluten |
| Chocolate Chip Cookies | butter, eggs | gluten | dairy, eggs |

**Repro:** log in as Bob (gluten + dairy allergy). Browse `/foods`. Granola Bar is shown — Bob's allergies should have filtered it (it contains milk powder and wheat flour). Severity is **critical**: a user with a fish or egg allergy could consume Caesar Dressing believing the app's filter protected them.

**Teaching point:** clean code + wrong data = wrong system. Code review alone cannot find this. Data-integrity tests (cross-field: ingredient text vs allergen flags) are the only automated path.

---

### Flaw 5 — The Weekly Drift

**Where:** [lib/utils/calculations.ts](../lib/utils/calculations.ts) — `checkCalorieTarget()`

**What it is:** the calorie check is per-day only (±10% of daily target). A user who eats +9% over target every day for a week is rated "on track" all seven days, but has consumed ~63% of an extra day's worth of calories for the week. No weekly rollup exists.

**Repro:** on a 2,000-kcal target, log meals totaling 2,180 kcal each day for seven days. Dashboard shows green all week. Weekly total: 15,260 kcal vs expected 14,000 kcal — a 1,260-kcal drift, ~half a day surplus — invisible to the UI.

**Teaching point:** aggregate/temporal reasoning is an AI weakness. It tests the function you point at; it does not ask "is there a missing *other* function?"

---

### Flaw 6 — Negative Gram Entry

**Where:** [lib/utils/calculations.ts](../lib/utils/calculations.ts) — `scaleNutrition()` + [app/log/page.tsx](../app/log/page.tsx)

**What it is:** `scaleNutrition()` has no validation on grams. Negative grams produce negative calories and macros, which flow into every downstream calculation. The log form does enforce `min="1"` on the input but the API accepts anything.

**Repro:** fire a direct API call —

```bash
curl -X POST http://localhost:3737/api/food-log \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=<alice-cookie>" \
  -d '{"foodId": 1, "grams": -200, "mealType": "lunch", "date": "2026-05-11"}'
```

The entry is accepted. The dashboard subtracts 330 kcal from today's total.

**Teaching point:** AI *can* find this — boundary/fuzz testing is a strength. But only if you ask for it. Default test generation stops at happy path + one empty case.

---

### Flaw 7 — Ghost Meal

**Where:** [lib/services/nutritionService.ts](../lib/services/nutritionService.ts) — `updateFood()`; related: [prisma/schema.prisma](../prisma/schema.prisma) `FoodLog` has no nutrition snapshot

**What it is:** `FoodLog` stores a FK to `Food` but does not snapshot the nutrition values at log time. When a food is edited (or its `calories`/`protein`/etc. are changed), *every existing log* that references it silently recomputes against the new numbers. A user looking at last week's history sees different totals than they saw at the time — their past changed.

**Repro:** as Alice, log 200 g Chicken Breast for lunch today. Dashboard reads 330 kcal. As the user who owns a user-created food (create one via `/foods` first, e.g., "Custom Sandwich" at 400 kcal/100g), log 100 g of it — 400 kcal. Edit "Custom Sandwich" to 800 kcal/100g. Refresh the dashboard. The old entry now reads 800 kcal. The day's totals, feedback, and history all shift retroactively.

**Teaching point:** temporal data integrity. A junior engineer sees a clean FK relationship and approves it; a senior engineer asks "what happens to historical records when the referent changes?" The fix is either a nutrition snapshot on FoodLog, or immutable food versioning. Neither is obvious from a code review of a single file.

---

### Flaw 8 — Color-Blind Confusion

**Where:** [app/components/BalancedBadge.tsx](../app/components/BalancedBadge.tsx), [app/dashboard/page.tsx](../app/dashboard/page.tsx) (feedback card + color classes), [app/history/page.tsx](../app/history/page.tsx) (status dots), [app/login/page.tsx](../app/login/page.tsx) line 66 (missing `<label>` for email input)

**What it is:** two distinct WCAG 1.4.1 (use of color) violations and one 1.3.1 (info and relationships) violation:

1. `BalancedBadge` is a bare colored dot. No `aria-label`, no visible text. A screen-reader user hears nothing; a user with deuteranopia cannot distinguish "balanced green" from "unbalanced red" at small sizes.
2. Dashboard daily-feedback card and history list items encode state entirely through background/dot color (emerald / amber / slate). Same problem.
3. Login email input has no `<label>` element (only a placeholder, which disappears on focus and is not a label per WCAG).

**Repro:** open the dashboard. Use Chrome DevTools → Rendering → "Emulate vision deficiencies" → Achromatopsia. Every status indicator becomes visually identical. Then run axe DevTools or Lighthouse A11y audit — it flags all three above.

**Teaching point:** accessibility is the area where AI is *most* useful (rule-based, well-documented standards) — but you have to prompt it to reason about user flows, not just run a flat WCAG checklist.

---

### Flaw 9 — Lost in Translation

**Where:** [lib/utils/unitConversion.ts](../lib/utils/unitConversion.ts) (helper exists but underused), [app/foods/page.tsx](../app/foods/page.tsx) line 331 (comment: "Weight column always shows grams, doesn't respect unit preference"), scattered `toLocaleDateString()` calls across pages

**What it is:** three overlapping localization bugs:

1. **Inconsistent units.** `formatWeight()` in `unitConversion.ts` converts g ↔ oz based on user preference, but the Foods page hardcodes grams. Bob (imperial user) sees `"g"` on Foods but `"oz"` conversions would be expected.
2. **Inconsistent date formatting.** Some pages call `formatDate()` from the helper; others call `toLocaleDateString()` directly without a format argument; the log form uses a native `<input type="date">` which renders in the OS locale. Users see a mix of `5/11/2026`, `May 11, 2026`, and raw ISO strings depending on which page they're on — none consistently match the PRD's MM/DD/YYYY requirement.
3. **Decimal separator.** `parseNumericInput()` uses `parseFloat`, which assumes `.` as the decimal separator. A user in a comma-decimal locale typing "1,5" for 1.5 kg gets parsed as `1` silently.

**Repro:** log in as Bob (imperial). Go to `/foods` — grams. Go to `/log` — also grams (no unit label at all). Go to `/dashboard` — grams. No page converts. Check the date headers across pages and observe they render in different formats. Type "1,5" into a grams input in a comma-decimal browser locale — observe the silent value drop.

**Teaching point:** the localization bug is not in any one place — it's the *inconsistency* across places. Cross-page consistency tests (as in [prompts.md §7](../prompts.md)) are the shape of test needed.

---

## What AI Can vs. Cannot Find

**AI Strengths:**

| AI Strength | Example | Flaw # |
|-------------|---------|--------|
| Input validation / boundary testing | Negative grams | 6 |
| Rule-based audits (a11y, lint) | Missing aria-labels, color-only indicators | 8 |
| Pattern matching (static analysis) | Missing error handling, code smells | — |
| Test generation from signatures | Happy path + boundary tests for pure functions | — |

**AI Weaknesses:**

| AI Weakness | Example | Flaw # |
|-------------|---------|--------|
| Domain knowledge (nutrition, health) | 80-kcal day is "Balanced" | 1, 2 |
| Data integrity vs. code correctness | Allergen tags don't match ingredients | 4 |
| Aggregate/temporal reasoning | Weekly calorie drift | 5 |
| Cultural/locale nuance | Ambiguous date formats, decimal separators | 9 |

---

## Key Takeaways for Students

1. **Tests verify implementation, not intent.** All tests pass, but the app is flawed.
2. **AI is great at generating tests for what code does.** It's bad at questioning whether the code should do that.
3. **QA reasoning = domain knowledge + skepticism + system thinking.** These are human skills.
4. **Data quality is as important as code quality.** Flaw 4 can't be found by code review alone.
5. **The best bugs are the ones that look like features.** "Balanced" feedback on a 80-kcal junk food day looks like it's working.
6. **AI accelerates QA but doesn't replace judgment.** Use AI for boilerplate, audits, and documentation. Use humans for "does this make sense?"
