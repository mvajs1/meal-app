# Prompts Playbook — AI-Assisted QA on the Meal Tracker

Paired prompts for eight QA tasks. For each task:

- **Basic prompt** — the kind you'd actually type without thinking too hard. Usually produces something that looks fine but is shallow.
- **What's missing** — the class of gap you'll see when you review it. This is the teaching beat.
- **Teacher prompt** — a realistic, short improvement. A few sentences, not a rubric. The goal is not to make AI perfect — it's to make the gaps visible on the *right* axis.

**The teaching pattern for every section is Generate → Review → Gap.** Don't skip the review. The whole point is to practice reading AI output critically.

**Inputs used:** Test Strategy and Test Cases take the [PRD](PRD.md). Everything after that takes a [user story](user-stories.md) or a [bug report](bug-reports.md) — not the PRD, not file paths. If your prompt lists file paths, you've left the QA role.

---

## 1. Test Strategy

**Input:** PRD

### Basic

> Here's our PRD for the Meal Tracker app:
> *[paste PRD.md]*
>
> Write a test strategy.

### What's missing when you review the output

- Generic test pyramid (unit / integration / E2E / performance) with no connection to this product.
- No coverage of non-code concerns: environments, release gates, regression cadence, who tests what, when.
- Treats `Open Questions: None` as authoritative. Doesn't push back on the spec.
- No risk ranking — every area looks equally important.

### Teacher

> Here's our PRD. Write a test strategy for a small team shipping this to production.
>
> Cover: scope and out-of-scope, the test types that actually apply here (functional, regression, accessibility, localization, performance, data integrity, security — include or exclude each with a reason), environments and who tests in each, regression approach (what triggers a full run vs. a smoke run), release entry/exit criteria, and the top 5 risks the PRD does not explicitly address.
>
> Keep it under three pages. Assume the reader is a developer lead, not an auditor. Treat `Open Questions: None` as suspicious.
>
> *[paste PRD.md]*

**Why this works:** names the QA concerns beyond test layers; bounds the output length; asks for explicit inclusion/exclusion reasoning per test type; primes skepticism of the spec in one sentence.

---

## 2. Test Cases (Manual)

**Input:** a single user story

### Basic

> Write test cases for the login feature.

### What's missing when you review the output

- No format — a vague bulleted list that can't go into a test-management tool.
- Happy path only; boundaries and negative flows absent.
- Generic ("enter valid email") with no concrete values.
- Nothing tied to the story's acceptance criteria.

### Teacher

> Here's a user story with acceptance criteria:
>
> *[paste US-01 from user-stories.md]*
>
> Write manual test cases in Gherkin (Given/When/Then). Cover: each acceptance criterion, boundary values, negative flows, and one or two exploratory cases a thoughtful tester would run. Each case should be executable by a tester with no prior context about this app. Give each case a short ID and a one-line title.

**Why this works:** one story at a time, explicit format, explicit coverage categories (including exploratory — the category AI forgets), and the reader-facing framing ("no prior context") forces concreteness.

---

## 3. Bug Triage

**Input:** a raw observation the tester just made

### Basic

> I found a bug: when I log only a small snack the dashboard still says the day is balanced. Write a bug report.

### What's missing when you review the output

- Severity picked by tone rather than by impact (usually Medium, sometimes High).
- Reproduction steps parroted from the question without hardening them.
- No user-impact framing — no "who is affected, how."
- No check for related or duplicate bugs.

### Teacher

> I observed this in the app: *[describe what you saw — inputs, steps, result — in your own words]*.
>
> Write a bug report with: title, severity, steps to reproduce, expected vs actual, user impact, environment.
>
> Use this severity scale — don't soften for politeness:
> - Critical: can harm a user (safety, health, privacy, data loss).
> - High: wrong business-rule output; primary flow broken.
> - Medium: UX degradation or secondary flow broken.
> - Low: cosmetic or developer-facing.
>
> Note: this is a health-adjacent app used by people with allergies. If the behavior could mislead a user about food safety or nutrition, call that out explicitly.

**Why this works:** rubric replaces intuition; context cue ("health-adjacent") reshapes severity reasoning; a short list of required fields, not a long template.

---

## 4. Unit Tests

**Input:** a bug report (writing a failing test) or a user story (writing green tests for a feature)

### Basic

> Write a unit test for this bug: *[paste bug report]*

### What's missing when you review the output

- Tests the behavior the AI *guesses* is buggy, not necessarily the one the report describes.
- Style doesn't match the existing suite (different imports, different fixtures, different naming).
- Happy-path assertion only; no boundary near the bug.
- Often green on the current codebase — proving nothing.

### Teacher

> Here's a bug report:
>
> *[paste a bug from bug-reports.md]*
>
> Write a unit test in Vitest that would have caught this bug. It must **fail on the current code and pass after the fix**. Use the style of our existing tests (describe / it, arrange-act-assert, fixtures at the top of the file). Include one boundary test near the bug's edge case. Tell me which file the test should go in, but don't read or rewrite unrelated code.

**Why this works:** "fails today, passes after the fix" is an unambiguous success criterion; explicit style pointer without listing paths; scoped to one bug; the model doesn't get pulled into refactoring.

---

## 5. API Tests

**Input:** a user story (feature coverage) or a bug report (regression lock)

### Basic

> Write API tests for the food logging endpoints.

### What's missing when you review the output

- Heavy on mocks; doesn't exercise the real auth + DB boundary.
- One endpoint at a time; no cross-endpoint flow assertion.
- No auth coverage (401 unauth, one user can't read another user's data).
- Dates/serialization assertions are vague ("greater than zero") instead of exact values.

### Teacher

> Here's a user story:
>
> *[paste US-06 or similar from user-stories.md]*
>
> Write integration tests using Vitest against the running Next.js dev server (HTTP, not mocks). Cover: authentication boundary (unauthenticated = 401; user A cannot touch user B's data), happy path with exact expected values from our seed data, and one cross-endpoint flow that proves the feature works end to end (e.g., log a food → read it back on the day's summary → see it in history). Use a real test user from the seed (alice@carvedrock.com / password123). Reset state between tests.

**Why this works:** names the story as oracle; one-liner rules that eliminate the biggest mistakes (don't mock, include auth, cross-endpoint); real test user specified so the output is runnable as-is.

---

## 6. UI Tests

**Input:** a user story (feature coverage) or a bug report (regression lock)

### Basic

> Write an end-to-end test for logging a meal.

### What's missing when you review the output

- Brittle selectors (classes, text). Breaks on the next UI tweak.
- Hard waits (`page.waitForTimeout`) instead of auto-waiting.
- Click-heavy; doesn't assert that the outcome matches the story's acceptance criteria.
- Doesn't log out or reset, so repeated runs pollute state.

### Teacher

> Here's a user story:
>
> *[paste US-06 from user-stories.md]*
>
> Write a Playwright test that walks the full flow described in the acceptance criteria. Use `data-testid` selectors (they exist in the markup). No hard waits — use `expect(...).toBeVisible()` and Playwright's auto-waiting. Every step must assert something (not just click). The test must be runnable from a clean state — log out in `afterEach`. Target `http://localhost:3737`.

**Why this works:** story drives the flow; the two policies that stop brittle tests (`data-testid`, no hard waits) are stated once each; explicit "every step asserts" prevents click-only pseudo-tests.

---

## 7. Performance Tests

**Input:** a bug report describing slowness, or a user story describing a hot path

### Basic

> Write performance tests for the API.

### What's missing when you review the output

- Measures everything equally; no hot-path targeting.
- No pass/fail criterion — produces a dashboard, not a test.
- Doesn't include auth, so the first request fails and the rest measure 401s.
- No concurrency or duration that reflects realistic load.

### Teacher

> Context: we're seeing complaints that the history page is slow for users with several weeks of food logs. Target: `GET /api/food-log/history?from=X&to=Y`.
>
> Write a load test using autocannon. Log in first via `POST /api/auth/login` (alice@carvedrock.com / password123) and forward the session cookie. Run 30 seconds at 20 concurrent connections. Warm up with 10 requests first so we don't measure Next.js's first-compile cost. Fail if p95 latency exceeds 300 ms. Output requests/sec, p50 / p95 / p99, and error rate.

**Why this works:** realistic origin story ("we're seeing complaints"); one endpoint, explicit threshold, explicit workload; auth handled up front; warmup prevents a false fail on the first measurement.

---

## 8. Code Review

**Input:** a diff plus the bug report or user story the diff is supposed to address

### Basic

> Review this code: *[paste diff]*

### What's missing when you review the output

- Nit-pick parade: JSDoc, magic numbers, naming. None of it changes whether the code is right.
- Doesn't check whether the diff actually solves the bug or implements the story.
- Doesn't flag missing tests for the new behavior.
- Approves clean-looking code that still has the original bug.

### Teacher

> I'm reviewing a PR that claims to *[fix this bug / implement this user story]*:
>
> *[paste the bug report or story]*
>
> Diff:
>
> *[paste diff]*
>
> Focus on:
> 1. Does the diff actually address the report above? Walk through the reproduction mentally — can you still reproduce it on the new code?
> 2. Did the PR add a test for the behavior? If not, flag that as a blocking finding.
> 3. Does the diff change anything the report didn't mention? Scope creep is a finding.
>
> Skip nits (naming, JSDoc, magic numbers) unless they materially change correctness or safety.

**Why this works:** the oracle is the ticket, not "code quality in general"; three concrete questions the reviewer wants answered; the "skip nits" line is the single biggest signal boost in AI code review.

---

## Cross-Cutting Principles

Same idea across all eight tasks:

1. **Name the oracle.** The PRD, a user story, a bug report, a diff. Not "the app."
2. **Short and realistic.** A QA engineer would actually send the teacher prompt above. If it looks like a rubric, it's probably overkill.
3. **One negative constraint helps more than ten positive ones.** "Don't mock the database." "Skip nits." "No hard waits." These are the lines that turn output from filler to focused.
4. **Pick the output format.** Gherkin, Vitest, autocannon, a bug-report template. Ambiguity is where AI loses coherence.
5. **Review every time.** The prompt does not replace the review — the Generate → Review → Gap cycle is the whole exercise. If AI's output is immediately usable, you wrote the prompt for a problem that didn't need AI.
