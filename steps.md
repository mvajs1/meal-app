# Teacher Demo — AI-Assisted QA on the Meal Tracker

A set of eight self-contained demos for an instructor to run live. Every demo follows the same three-beat rhythm:

1. **Generate** — type a realistic prompt into AI. Show it running.
2. **Review** — read the output with the class.
3. **Gap** — point at what's missing, wrong, or misleading. This is the teaching beat.

Don't skip the review. If the output looks fine, that's often the bug — re-read it with skepticism. If the output is obviously wrong, say so out loud: students need to see how you decide what to trust.

**Inputs flow:**
- Demo 1 (Test Strategy) and Demo 2 (Test Cases) use the **[PRD](PRD.md)**.
- Every demo after that uses a **[user story](user-stories.md)** or a **[bug report](bug-reports.md)** — never the PRD, never a file path. That's what a QA actually has.

Run in sequence or cherry-pick. Total ~2 hours end to end; each demo is standalone.

---

## Before You Start

1. **Install and run the app** in a dedicated terminal:
   ```bash
   npm install && npm run setup
   npm run dev            # http://localhost:3737
   ```

2. **Open these files in tabs:**
   - [PRD.md](PRD.md)
   - [user-stories.md](user-stories.md) — leave scrolled to US-01 to start
   - [bug-reports.md](bug-reports.md) — this is your answer key; keep it off screen share
   - [prompts.md](prompts.md) — paste prompts from here

3. **Set up Trello** (or a simple Kanban board) with the user stories pre-loaded. You'll reference these during the session.

4. **Two browser tabs:** logged in as Alice (`alice@carvedrock.com` / `password123`) and Bob (`bob@carvedrock.com`). Password for all demo users is `password123`.

5. **Hide this file from screen share.** Students should see the AI chat, the code/artifact tabs, and the terminal. Narrate the steps from memory or a printed copy.

---

## Demo 1 — Test Strategy (~15 min)

**What you're demonstrating:** AI will produce a plausible-looking test strategy from a PRD, but it won't probe the spec, rank risk, or think about delivery/environments unless you ask.

### Generate

Open [PRD.md](PRD.md). Paste into AI:

> Here's our PRD for the Meal Tracker app. *[paste PRD.md]* Write a test strategy.

### Review

Read the output together. Expect:
- A clean outline: unit / integration / E2E / performance / security.
- "Test everything" implicit energy — no ranking.
- No mention of who tests where, when regression runs, what promotes a release.
- A confident close. Probably echoes "Open Questions: None — approved for development" without comment.

### Gap — narrate these points

- **Where are environments?** Who tests on local, staging, production? How do we handle test data across them?
- **What triggers a regression run?** Every commit? Every PR? Every release? How big?
- **What kinds of testing aren't mentioned?** Data integrity for allergens. Localization. Accessibility as a first-class concern. Non-functional criteria.
- **Read "Open Questions: None" aloud.** "Do you believe that? In a product that decides what to filter for allergy users, we have zero open questions?" A junior QA accepts this. A senior QA writes five in the next 10 minutes.

### Then show the teacher prompt

Paste from [prompts.md §1](prompts.md). Let it run. Read the new output. Call out:

- Inclusion/exclusion reasoning per test type (accessibility "included — WCAG 2.1 AA is a PRD requirement"; security "deferred — session auth is basic, no PII beyond email").
- Environment matrix (often a simple table).
- Top 5 risks the PRD doesn't address — this is where the real value lives.

**Teaching point:** *"A basic prompt gets you a template. A good prompt gets you the questions the PRD didn't answer."*

---

## Demo 2 — Test Cases (~15 min)

**What you're demonstrating:** test cases grounded in a single user story are precise and actionable; "test cases for the feature" in the abstract is unusable.

### Generate

Paste:

> Write test cases for the login feature of the Meal Tracker app.

### Review

Expect a bulleted list of obvious scenarios: "valid login", "invalid login", "empty fields". No format, no IDs, no boundary thinking.

### Gap — narrate

- **Where's the format?** This can't go into TestRail, Xray, Zephyr, or even a Trello card. It's a brainstorm.
- **Where are the boundaries?** Very long inputs, weird characters, rate limiting, already-logged-in behavior.
- **Where's the negative stuff?** Tampered cookies. Stolen sessions. Expired sessions.
- **Where's the exploratory layer?** Copy-paste into the password field. Autofill collisions. Locked-out state.

### Then show the teacher prompt

Open [user-stories.md](user-stories.md) and copy US-01 (Login). Paste from [prompts.md §2](prompts.md) with the story body inlined. Let it run.

Read the new output. Call out:
- Gherkin format — can go straight into a test-management tool.
- Each acceptance criterion from the story has at least one case.
- Boundaries and negatives are tagged explicitly.
- Exploratory cases are separated so a planner can estimate them differently.

Compare side-by-side: the basic output is a thought, the teacher output is a test plan.

**Teaching point:** *"When a QA says 'give me test cases,' give them a story. Manual test cases are always one-story-at-a-time. If the AI has the whole PRD, it gives you the whole PRD flattened — and useless."*

---

## Demo 3 — Bug Triage (~15 min)

**What you're demonstrating:** severity and user-impact come from the rubric you give, not from AI intuition. Without a rubric, safety bugs get called "Medium."

### Generate — live discovery first

Open the Bob browser tab (Bob is dairy + gluten allergic). Navigate to `/foods`. Search **Granola Bar**. Click to expand.

Read aloud:

- **Ingredients:** oats, milk powder, wheat flour, honey, nuts, palm oil.
- **Allergen tags:** nuts.

"Milk powder is in the ingredients. Dairy is not in the allergen tags. Wheat flour is in the ingredients. Gluten is not in the allergen tags. Bob is allergic to both. The filter let this through."

Now paste into AI:

> I found a bug: Bob (dairy + gluten allergic) can see Granola Bar in the food browser because the allergen tags on that food don't include dairy or gluten even though the ingredient list mentions milk powder and wheat flour. Write a bug report.

### Review

The output will be clean. It will almost certainly pick **Medium** or possibly **High** severity with polite language. Steps will mirror what you typed.

### Gap — narrate

- **Severity.** "Medium means the feature is a little broken. A user with a severe allergy could eat this food thinking it was cleared by the filter. What's the worst outcome? Anaphylaxis. That's Critical. AI doesn't know to call it Critical until we tell it how we measure severity."
- **User impact.** "The report says 'may affect users with allergies.' Who, concretely? Bob. Which allergy? Dairy and gluten. What would Bob do in practice? That's the impact statement. The AI's version is wallpaper."
- **Related bugs.** "Is this a one-off, or is the same issue true of other foods? Did the AI check? No, it answered what we asked."

### Then show the teacher prompt

Paste from [prompts.md §3](prompts.md) with the same observation. Let it run.

Read the new output:
- Severity is now **Critical** with the rubric line cited.
- Impact mentions Bob by name and describes the allergic reaction scenario.
- There's often a "check for related bugs" section that prompts you to look at similar foods (Caesar Dressing, Protein Bar, Chocolate Chip Cookies — which are the other instances of this exact flaw in the seeded data).

If time permits, open [bug-reports.md](bug-reports.md) and show BUG-04 as an "answer key." Most of what the teacher prompt produced should match it.

**Teaching point:** *"The severity rubric is the whole difference. AI will politely downgrade safety bugs every time unless you tell it how to measure."*

---

## Demo 4 — Unit Tests (~20 min)

**What you're demonstrating:** tests generated *from a bug report* force a failing test first — which is honest TDD. Tests generated from a file are green by default and prove nothing.

### Generate

Open [bug-reports.md](bug-reports.md) and copy BUG-06 (Negative grams accepted). Paste from [prompts.md §4](prompts.md):

> Here's a bug report: *[paste BUG-06]*
>
> Write a unit test in Vitest that would have caught this bug. It must fail on the current code and pass after the fix. …

### Review

AI produces a Vitest test. Save it to a new file (`tests/negativeGrams.test.ts`). Run:

```bash
npm run test -- negativeGrams
```

### Gap — narrate as you watch the run

Three possible outcomes, each with a teaching beat:

- **Test is red (failing).** Good — the bug is demonstrable, AI understood the report. "Now we have a defect we can point to. Next step: fix and re-run."
- **Test is green (passing).** Means AI tested something the code already handles, or its assertion is too loose. Open the test and read it together. Common mistake: AI checks that `scaleNutrition(-100)` returns a number (it does, just a negative one) rather than asserting the API or form should reject negative input. Rewrite the assertion. Re-run.
- **Test errors.** Usually wrong import or wrong function signature because AI guessed. Fix the imports. Re-run.

**This debugging is the demo.** Students see that "AI wrote the test" is the start of the work, not the end.

### Turn it into a permanent artifact

If the test fails on the current code, add `it.fails(...)` (or its equivalent) with a comment pointing at the bug ID:

```ts
it.fails('BUG-06: API must reject negative grams', () => {
  // …
});
```

Re-run. Suite is now green with a documented known defect.

**Teaching point:** *"A failing test is a bug you can see. A passing test could be anything. AI generates the former only if you give it a bug report and tell it to fail."*

---

## Demo 5 — API Tests (~20 min)

**What you're demonstrating:** API tests from a user story cover a feature end-to-end; API tests "for an endpoint" cover one hop and miss everything else.

### Generate

Open [user-stories.md](user-stories.md). Copy US-06 (Log a food entry). Paste from [prompts.md §5](prompts.md):

> Here's a user story: *[paste US-06]*
>
> Write integration tests using Vitest against the running Next.js dev server (HTTP, not mocks). Cover: authentication boundary …

Install a test HTTP client if needed:

```bash
npm install -D supertest @types/supertest
```

Save the generated file as `tests/foodLog.api.test.ts`. Make sure the dev server is running. Run:

```bash
npm run test -- foodLog.api
```

### Review

Expect five-ish tests:
- 401 without auth
- 403 or 404 when user A tries to read user B's entry
- POST → returns 201, body matches input
- GET → includes the entry just posted
- DELETE → entry disappears; follow-up GET confirms

### Gap — narrate

- **Did it test the cross-endpoint flow?** Look for a test that logs a food via POST, then reads it via `/api/food-log?date=...`. If absent, that's the most important integration test and AI skipped it.
- **Did it use real auth?** Search the output for `getCurrentUser` mocks or stub imports. If present, point out: "This is no longer an integration test. It's a unit test with extra steps."
- **Did it assert exact values?** `expect(body.calories).toBeGreaterThan(0)` passes for any non-zero number. Real integration tests assert specific numbers computed from seed data.

If the generated test skipped the cross-endpoint flow, ask AI:

> Add a test that posts a food log for today, then reads `/api/food-log?date=<today>` and asserts the entry is present with the grams we posted.

Re-run.

**Teaching point:** *"A user doesn't call one endpoint. They log a meal, then look at their dashboard. Integration tests that don't cross endpoints miss the class of bug users actually see."*

---

## Demo 6 — UI Tests (~20 min)

**What you're demonstrating:** Playwright tests from a user story are stable; tests written from "this is what the page looks like" are brittle.

### Generate — install Playwright live

```bash
npm init playwright@latest -- --quiet --browser=chromium --install-deps=false
```

Accept defaults. Test directory: `tests/e2e`. In `playwright.config.ts`, set `use: { baseURL: 'http://localhost:3737' }`.

Open [user-stories.md](user-stories.md). Copy US-06 (Log a food entry). Paste from [prompts.md §6](prompts.md):

> Here's a user story: *[paste US-06]*
>
> Write a Playwright test that walks the full flow described in the acceptance criteria. Use `data-testid` selectors (they exist in the markup). No hard waits …

Save as `tests/e2e/log-meal.spec.ts`. Run:

```bash
npx playwright test log-meal
```

### Review

Expect a test that: logs in, navigates to the log page, searches a food, sets grams, submits, returns to the dashboard, verifies the entry is there.

### Gap — narrate

Before running, scan the generated code:

- **Selectors.** If you see `.getByText('Sign In')` or `.page.locator('.login-button')`, that's brittle. The markup has `data-testid="login-submit"` — the prompt said to use those. Fix any that slipped through.
- **Waits.** Search for `waitForTimeout`. If present, remove and replace with an `expect(...).toBeVisible()`.
- **Assertions per step.** If a step only clicks, add an assertion — "the food search input is visible," "the selected-food card appears with the food name."
- **Cleanup.** `afterEach` should log the user out or clear state. Otherwise the test passes once and fails on rerun with "entry already exists."

Run it. If it fails, use `npx playwright show-report` to walk the trace together — it's a great demo of the tooling.

**Teaching point:** *"The two rules that keep UI tests alive for more than a month — use test IDs, don't sleep — are the same two rules AI will forget unless you repeat them in every prompt."*

---

## Demo 7 — Performance Tests (~20 min)

**What you're demonstrating:** a performance test needs a hot path, a threshold, and auth. Without those, AI produces a benchmark dashboard and calls it a test.

### Generate

Install load tool:

```bash
npm install -D autocannon
```

Paste from [prompts.md §7](prompts.md):

> Context: we're seeing complaints that the history page is slow for users with several weeks of food logs. Target: `GET /api/food-log/history?from=X&to=Y`. Write a load test using autocannon. …

Save as `scripts/perf.ts`. Run:

```bash
TMPDIR=/tmp/tsx-work npx tsx scripts/perf.ts
```

### Review

Expect: a login step that captures the cookie, a warmup loop, autocannon invocation at 20 concurrent for 30 seconds, output of reqs/sec and percentile latencies, and an exit code driven by the p95 threshold.

### Gap — narrate

- **Did it authenticate?** Look for the login step and the forwarded cookie. If missing, the test measures 401s — fast but meaningless.
- **Did it warm up?** Next.js lazily compiles route handlers on first hit. Without a warmup, the first measurement is a huge outlier and drags up p95.
- **Did it set a threshold?** If the script only prints numbers and exits 0, that's a dashboard, not a test. Add the exit-1-on-breach.

Run. Discuss the numbers:
- If p95 is under 50 ms: lock in 300 ms as a loose budget and monitor for regressions.
- If p95 is near or over 300 ms: "That's where a week's worth of logs starts costing us. The fix is probably pagination or query optimization. This test will catch a future regression."

**Teaching point:** *"Performance tests without a threshold are dashboards. A test either passes or fails. If you can't decide the threshold, you're not ready to write the test — go ask product what 'slow' means."*

---

## Demo 8 — Code Review (~15 min)

**What you're demonstrating:** AI code review is strong when pointed at a ticket and a diff; weak when asked "is this good code?"

### Generate — create a deliberate regression

Pick any clean diff from recent history, *or* introduce a subtle regression live. One easy option: open [lib/utils/calculations.ts](lib/utils/calculations.ts) and remove the `&& proteinPercent <= 35` clause from the `proteinOk` line. Save — don't commit. Now:

```bash
git diff lib/utils/calculations.ts
```

Keep the diff on screen. Paste the **basic** prompt first:

> Review this code: *[paste diff]*

### Review

Expect a list of mild observations: JSDoc hints, magic-number complaints, maybe a note about clarity. Missing: any comment that the upper bound on protein percentage is gone and the function's intent is now broken.

### Gap — narrate

"The code looks fine. That's the failure mode. AI has no idea what the function is *for*. It's reviewing syntax."

### Then show the teacher prompt

Open [bug-reports.md](bug-reports.md) and copy BUG-01 (Dashboard says 130-kcal day is balanced) — or any bug that touches balanced-day logic. Paste from [prompts.md §8](prompts.md) with the bug and diff both inlined.

Now the AI has an oracle: "this diff claims to fix BUG-01." It will:
- Walk the reproduction and ask whether the diff fixes it (it does not — removing the upper bound makes balanced-day logic worse, not better).
- Flag the missing test for the bug as blocking.
- Note that the diff changes behavior not related to the bug — scope creep.

Compare side-by-side. Restore the deleted clause.

**Teaching point:** *"Code review without a ticket is a taste discussion. Code review against a ticket is an engineering decision. Always bring the ticket."*

---

## Closing Reflection (5 min)

Pull up [prompts.md — Cross-Cutting Principles](prompts.md). Read them aloud:

1. Name the oracle.
2. Short and realistic.
3. One negative constraint beats ten positive ones.
4. Pick the output format.
5. Review every time.

Then say:

> *"Every demo today was the same three beats. Generate, review, gap. The teacher prompts were a few sentences longer than the basic ones, but they were still prompts a person would actually type. The difference wasn't length — it was naming the oracle and specifying the format. That's it.*
>
> *And none of this removes the review. The prompt sets up what AI produces. You still read it.*
>
> *AI doesn't know your app. Every prompt is a one-shot onboarding. The quality of the output is the quality of that onboarding."*

---

## Appendix — Common Live-Demo Mishaps

| Symptom | Cause | Fix on the fly |
|---|---|---|
| `npx tsx ...` fails with `EPERM ... pipe` | OS tmpdir permissions | Prefix with `TMPDIR=/tmp/tsx-work` |
| `prisma migrate dev` wants to reset the DB interactively | Schema drift vs existing migration | `npm run db:reset` (destructive, fine on dev) |
| Playwright "browser not found" | First install missed downloading binaries | `npx playwright install chromium` |
| AI invents an API endpoint that doesn't exist | Prompt didn't ground it in a real story or bug | Re-prompt with the actual user story or bug report as input |
| Generated unit test passes when it should fail | AI's assertion is too loose | Read the assertion out loud; tighten it and re-run |
| Dev server not reflecting changes | Next.js caching a stale build | `rm -rf .next && npm run dev` |
