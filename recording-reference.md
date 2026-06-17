# GenAI Testing Recording Guide

Topic: Demonstrate how to use GenAI to generate API tests, performance tests, and fuzz tests for identifying unexpected behavior under edge conditions and load.

App: Meal Tracker  
Local app URL: `http://localhost:3737`  
Demo login: `alice@carvedrock.com` / `password123`

How to use this guide:

- Sections labeled `Slide` are learner-facing content.
- Sections labeled `Speaker note` are what you say while showing the slide.
- Setup notes, commands, and prompts are presenter-only references for the live demo.

---

## Clip 1: API Stress Testing With GenAI

Target length: 5-6 minutes  
Target endpoint: `GET /api/food-log/history?from=YYYY-MM-DD&to=YYYY-MM-DD`  
Recommended tool: `autocannon` with a small AI-generated capacity-discovery runner

Why this tool:

- `autocannon` is a widely used HTTP benchmarking and load-testing tool for Node.js services.
- It is simple enough for a short demo: one dependency, one script, readable output.
- It reports the metrics we need for stress testing: requests/sec, latency percentiles, and errors.
- It works well with an AI-generated wrapper script that runs multiple concurrency levels in sequence.
- It keeps the focus on GenAI-assisted test design instead of tool configuration.

Tool note:

- Many tools can support performance testing.
- For this clip, `autocannon` is useful because the demo is focused on one HTTP endpoint and one question: where does behavior start to degrade?
- The important GenAI lesson is not the specific tool. It is how AI helps design the workload, generate the script, and interpret the result.

Presenter note:

- Do not prebuild the stress runner for the recording.
- The demo should show AI helping create the stress-data idea and the capacity-discovery script live.
- If you want a reliable visible degradation point, ask AI during the demo how to increase data volume or lower the p97.5 threshold without making the scenario unrealistic.
- Optional prepared helper: `scripts/seedStressHistory.ts` creates a larger set of food-log records for Alice so the history endpoint has more work to do. It is data setup only, not the stress-test runner.

Why this endpoint:

- It represents the History page workflow.
- It is authenticated, so the test exercises real session handling.
- It is read-only, so it is safe for repeated load testing.
- It queries food logs over a date range and performs aggregation.
- It is a realistic candidate for latency issues as user history grows.

Testing goal:

- Do not assume a fixed load like "20 users for 30 seconds."
- Start with low concurrency and increase gradually.
- Stop when the endpoint shows degradation: high p97.5 latency, high error rate, or unstable throughput.
- Use a safety cap so the demo cannot run forever; the cap is not the target load.
- Use AI to generate the runner, interpret the curve, and recommend the next investigation.

Important demo note:

- You do not have to literally crash the app.
- For a strong laptop, the app may handle the demo load easily, or the load generator may become the bottleneck first.
- Define "breaking point" as the first point where the service violates a chosen quality target, such as p97.5 latency over 300ms, error rate over 1%, or throughput flattening while latency rises.
- If the app does not degrade naturally, use a controlled demo setup: larger test data, a lower resource limit, or a smaller safety threshold.

Relevant files to show:

- `app/api/food-log/history/route.ts`
- `lib/services/foodLogService.ts`
- `app/history/page.tsx`

### Clip Flow

#### 1. Slide: What Is Performance Testing?

Title: `Performance Testing`

Bullets:

- Answers a simple question: “Will this still work well when people actually use it?”
- Simulates realistic user behavior instead of testing only individual endpoints
- Measures when the app starts slowing down, failing, or using too many resources
- Gives the team evidence to fix bottlenecks before users are affected

Speaker note:

> Performance testing checks whether a system is fast and stable enough under realistic usage. We are not just asking, "does the API work?" We are asking, "does it keep working well when real users put pressure on it?"

#### 2. Slide: Load Testing Vs. Stress Testing

Title: `Load Vs. Stress`

Bullets:

- Load testing checks expected or target usage
- Stress testing pushes beyond expected usage
- Load testing asks: can we handle normal demand?
- Stress testing asks: where do we break or degrade?
- Both need clear success criteria

Speaker note:

> Load testing validates a known target, like expected traffic for launch day. Stress testing is more exploratory. It increases pressure until latency rises, errors appear, or throughput stops improving. In this clip, we are demonstrating stress testing.

#### 3. Slide: How AI Helps With Load Testing

Title: `AI For Performance Testing`

Bullets:

- Converts user workflows into test scenarios
- Suggests realistic traffic mixes and ramp-up patterns
- Suggests degradation signals to monitor
- Adds thresholds for expected performance
- Finds the last healthy and first degraded levels
- Summarizes results and explain the failure pattern 

Speaker note:

> For load testing, AI is helpful when we already know the target usage. It can turn a user journey into a repeatable test, add checks and thresholds, and summarize whether the system met the expected load.

> For stress testing, AI helps with exploration. Instead of hard-coding one load number, we can ask AI to generate a runner that increases concurrency and watches for degradation. The goal is to discover the system's practical limit.

#### 4. Slide: What Are We Testing In This App?

Title: `Target Endpoint`

Bullets:

- Endpoint: `GET /api/food-log/history`
- Represents the History page workflow
- Reads authenticated user data
- Queries food logs across a date range
- Aggregates calories, macros, feedback, and entry counts

Speaker note:

> For this app, the best stress-test candidate is the history endpoint. It is read-only, user-facing, authenticated, and does real database work, so it is a meaningful performance target.

#### 5. Slide: Demo Goal

Title: `Demo Goal`

Bullets:

- Use AI to generate a capacity-discovery stress test
- Set a quality threshold
- Authenticate before running requests
- Increase concurrency until the endpoint degrades
- Capture p50, p97.5, p99, throughput, and error rate at each step
- Interpret results with AI assistance

Speaker note:

> The goal is not just to create traffic. The goal is to show how AI helps us discover the endpoint's practical limit and describe what changed as load increased. On a powerful laptop, localhost performance can look better than a real deployment. For this demo, breaking point means controlled degradation: latency gets too high, errors appear, or throughput stops improving. If needed, we can make the scenario repeatable by adding more test data or running the app with lower CPU or memory.

#### 6. Show The Endpoint, 40 Seconds

> Now I will move from the slides into the actual demo. I am going to ask AI to help me create a stress test that ramps up automatically, instead of hard-coding one load level and pretending it proves capacity.

Open `app/api/food-log/history/route.ts`.

Point out:

- The endpoint requires an authenticated user.
- It requires `from` and `to` query parameters.
- It calls `getHistoryRange`.
- It returns summarized history data.

#### 7. Ask AI To Generate A Capacity-Discovery Runner, 90 Seconds

Prompt to AI:

```text
ROLE
You are a senior performance/QA engineer working inside an existing Next.js 16 + Prisma
(SQLite) meal-tracking app. Write idiomatic code that matches the repo's conventions.

CONTEXT
- Target endpoint to load-test: GET /api/food-log/history?from=X&to=Y (dates are YYYY-MM-DD).
  The app runs at http://localhost:3737.
- Auth: POST /api/auth/login with { email, password } sets an httpOnly `session_token` cookie;
  the endpoint returns 401 without it.
- Test user: alice@carvedrock.com / password123.
- Analysis artifacts are written to reports/;
- Use autocannon for load generation.

TASK
1) Seed script at scripts/seedLogHistoryPerformance.ts:
   - clear alice's existing food logs first
   - for each of the last 365 days, for each meal type (breakfast, lunch, dinner, snack),
     insert exactly 3 food-log entries → 12 entries/day, 4,380 total for the year
   - cycle through the existing seeded foods, with reasonable gram amounts
   - print the resulting date range (from = 365 days ago, to = today)

2) Performance test at tests/performance/logHistory.performance.spec.ts using autocannon:
   - log in, capture the session cookie, reuse it on every request
   - preflight one request and assert 200 before ramping
   - stepped concurrency: start low and step up (e.g. doubling); a max concurrency is only a
     safety cap, never the target. Short measurement window per step.
   - per step print: concurrency, requests/sec, p50, p97.5, p99 latency, non-2xx/error rate
     (autocannon's result.latency exposes p50 / p97_5 / p99 directly)
   - stop when ANY: p97.5 > 300ms, error rate > 1%, or throughput stops increasing while
     latency keeps rising
   - print the LAST HEALTHY and FIRST DEGRADED level (with the trip reason)
   - make ramp, thresholds, window, and from/to range overridable via env vars (default the
     range to the full seeded year)

3) Wire npm scripts: `db:seed:performance` (runs the seed) and `test:performance` (runs the test)

EXPECTED OUTPUT
- The two files above plus the package.json edits.
- The test must ALSO persist its results to reports/logHistory-performance-test-result.json
- End your reply with a short summary: files created/changed and the exact commands to run them.
```

What to show:

- AI generating the runner script.
- You reviewing whether it logs in, captures cookies, ramps concurrency, and stops on degradation.
- If AI suggests installing `autocannon`, that is part of the live demo, not pre-setup.


Useful controls:

```bash
# AI also generates a hardcoded seed script, wired as an npm script:
npm run db:seed:performance   # seeds Alice a full year of history (~4,380 rows)
```

Note:

> If you show commands, frame them as AI-generated demo artifacts. The point is that learners watch GenAI create the testing support, not that the repository was prepared ahead of time.

#### 8. Review The AI Output, 60 Seconds

Checklist to say out loud:

- Does the script log in before the load phase?
- Does it forward the `session_token` cookie?
- Does it start low and increase load step by step?
- Does it have a stopping rule for degradation?
- Does it assert `200` responses?
- Does it report the last healthy level and first degraded level?
- Does it avoid testing unauthenticated `401` responses by mistake?

Say:

> This review step matters. A fixed-load test can tell us whether the API survived one chosen scenario, but a stress test should help discover the point where the system starts to bend. Here I want to make sure the generated runner is actually exploring capacity.

#### 9. Run The Scripts And Interpret The Result, 90 Seconds

The presenter runs the AI-generated scripts manually, then asks AI to interpret the saved
report. Run these between building the scripts (step 7) and asking for the analysis:

```bash
# 0. One-time setup (only if not already done)
npm install                       # ensure deps incl. autocannon are installed
# ensure a .env exists with: DATABASE_URL="file:./dev.db"

# 1. Start the app on :3737 — pick ONE (leave it running):
npm run dev                       # quick, but dev-mode latency is inflated
npm run build && npm start        # production build (recommended for the real demo)

# 2. In a second terminal: seed Alice's full year of history (~4,380 rows)
npm run db:seed:performance       # prints the from/to date range it created

# 3. Run the stepped performance test
npm run test:performance          # prints the ramp table AND writes the report

# 4. Confirm the report landed
ls -la reports/logHistory-performance-test-result.json
```

Show result fields:

- `concurrency`
- `requests/sec`
- `p50`
- `p97.5`
- `p99`
- `error rate`
- `last healthy level`
- `first degraded level`

Prompt to AI:

```text
ROLE
You are a performance engineer analyzing load-test results and advising on fixes.

CONTEXT
- Read the results from reports/logHistory-performance-test-result.json (don't ask me to paste).
  It contains autocannon's per-step result objects plus a summary; read whatever fields are there.
- The run load-tested GET /api/food-log/history?from=X&to=Y against alice@carvedrock.com, who
  has a full year of history: 12 entries/day × 365 days = 4,380 FoodLog rows.
- Handler behavior: it loads every FoodLog row in the range with its related Food, then groups
  by day and computes macros in JS (no SQL aggregation, no pagination). Backed by SQLite via Prisma.
- If the report records the run mode (dev/prod), use it; otherwise infer from the latency magnitude.

TASK
- Identify the last healthy level and the first degraded level, and which stop condition tripped.
- Interpret the curve: where does throughput stop scaling, and how do p50/p97.5/p99 behave as
  concurrency rises (queueing/saturation vs. a hard error wall)?
- Diagnose the most likely bottleneck given the handler behavior above.
- Recommend concrete, prioritized fixes (indexing, SQL aggregation, pagination, payload shaping,
  caching) and state whether these numbers are trustworthy or if I should re-run against a
  production build.

EXPECTED OUTPUT
Respond in this structure:
1. Verdict — one line: last healthy vs. first degraded (concurrency, req/s, p97.5) + trip reason.
2. Ramp table — a compact table of the steps (conns, req/s, p50/p97.5/p99, err%).
3. Curve interpretation — 2–4 sentences on the saturation behavior.
4. Bottleneck diagnosis — ranked most→least likely, with the evidence from the data.
5. Recommendations — prioritized list (P1/P2/P3), each with the expected impact.
6. Trustworthiness — dev vs prod caveat and whether to re-run.
```

Close-out line:

> AI generated the runner and helped summarize the curve. The tester still supplied the endpoint, degradation criteria, and final judgment.

---
## Clip 2: AI-Driven Fuzz Testing With Endpoint-Derived Invariants

Target length: 5–6 minutes
Target endpoint: `POST /api/foods`
Authentication endpoint: `POST /api/auth/login`
Recommended tool: `fast-check` with Vitest

---

## Core Message

In this demo, we are not manually brainstorming a long checklist of edge cases.

Instead, we ask AI to inspect the exact endpoint implementation, discover the highest-risk invariants, generate a property-based fuzz test, run it, and summarize the results.

QA still owns the judgment:

* AI discovers the risk model
* QA chooses the invariant
* `fast-check` generates many payload variations
* AI runs the tests
* The final proof is black-box: payload → response → finding

---

# Clip 2: Fuzz testing with GenAI

## 1. Slide: What Is Fuzz Testing?

Title: `Fuzz Testing`

Bullets:

* Sends many unexpected or unusual inputs
* Looks for crashes, bad responses, and unsafe behavior
* Useful for APIs that accept user-controlled data
* Works best when testing an invariant
* A failing case can shrink into a minimal payload

Speaker note:

> Fuzz testing asks: what happens if the input is strange, malformed, incomplete, or extreme? The goal is not that every request succeeds. The goal is that the API responds safely and predictably. With property-based fuzzing, we define an invariant, then generate many inputs to see if that invariant holds.

---

## 2. Slide: What Is An Invariant?

Title: `What Are We Testing?`

Bullets:

* An invariant is something that should always be true
* It describes behavior, not one example input
* Fuzz testing checks the invariant across many generated inputs
* Failures give us concrete payloads to investigate

Speaker note:

> Instead of asking AI for five example payloads, I want AI to identify the most important rule this endpoint should always follow. That rule becomes the invariant. Then fast-check can generate many variations to challenge it.

---

## 3. Slide: Where AI Helps

Title: `Where AI Helps`

Bullets:

* Reads the route, service, and schema
* Infers risky assumptions
* Ranks testable invariants
* Generates the fuzz test
* Runs the test
* Summarizes failures into QA findings

Speaker note:

> AI is not just generating test code here. It first acts like a code-aware QA assistant. It analyzes the implementation, identifies high-risk invariants, generates the test, runs it, and then summarizes what happened.

---

## 4. Show The Endpoint

Open:

* `app/api/foods/route.ts`

Say:

> I’m going to give AI the exact endpoint implementation. I’m not going to tell it which edge cases to focus on. I want AI to infer the risky assumptions from the code.

Point out only at a high level:

* The route receives JSON
* The service creates the food record
* The schema shows the expected data model

Avoid naming specific edge cases before AI analyzes the code.

---

## 5. Prompt AI To Discover Invariants

Prompt:

```text
Analyze POST /api/foods as a fuzz-testing target using the exact implementation.

Files:
- app/api/foods/route.ts

Do not generate tests yet.

Your task:
1. Identify the endpoint’s user-controlled inputs.
2. Infer the assumptions the implementation makes about those inputs.
3. Discover invariants that should always hold for this endpoint.
4. Rank the invariants by likely defect value.
5. Recommend the single best invariant to test first.

For each invariant, include:
- what the invariant means
- what code behavior suggests this invariant may be risky
- what result would count as a failure

Do not rely on generic API testing advice.
Base the analysis on the provided code.
```

Say:

> This is the discovery step. AI is building the risk model from the implementation. I’m not feeding it a checklist of edge cases.

---

## 7. Pick One AI-Recommended Invariant

Say:

> AI recommended several invariants. I’m going to pick one that is high impact, likely to fail, and easy to verify through the API response.

Example narration:

> The invariant I’m selecting is: client-controlled input should not cause the endpoint to return an internal server error.

Or, use the exact invariant AI recommends.

Speaker note:

> QA still makes the decision. AI recommends where the risk is, but I decide which behavior matters enough to test.

---

## 8. Prompt AI To Generate And Run The Fuzz Test

Prompt:

```text
Generate and run a Vitest + fast-check HTTP fuzz test for the selected invariant.

Selected invariant:
[paste the invariant selected from your previous analysis]

Use the same endpoint implementation you just analyzed.

Application:
- Base URL: http://localhost:3737
- Auth endpoint: POST /api/auth/login
- Target endpoint: POST /api/foods

Authentication:
- Login with:
  - email: alice@carvedrock.com
  - password: password123
- Capture and reuse the session cookie for requests to POST /api/foods.

Test requirements:
- Use fast-check to generate many input variations.
- Design the arbitraries based on your endpoint analysis.
- Do not use a small fixed list of example payloads as the main test.
- Do not assume the risk dimensions are already known.
- Include comments explaining how the generated inputs relate to the selected invariant.
- Use numRuns: 100 for the demo.
- Set a fixed seed so failures are reproducible.
- Preserve fast-check shrinking so failures reduce to small counterexamples.

Assertions:
- Define the pass/fail oracle from the selected invariant.
- Treat authentication failure as a test setup problem.
- When the invariant fails, print:
  - generated payload
  - response status
  - response body

Implementation:
- Create the test at tests/fuzz/foods.fuzz.test.ts.
- Install fast-check if it is not already installed.
- Run the dev server and run the test.
- After running, summarize the result as a QA finding.
```

Possible commands AI may run:

```bash
npm install -D fast-check
```

```bash
npm run dev
```

```bash
npx vitest run tests/fuzz/foods.fuzz.test.ts
```

Say:

> I’m asking AI to do the whole workflow now: generate the test, run it, and summarize the result. The key is that fast-check generates the cases. I only need to review the invariant and the failure.

---

## 9. Show The Test Running

Run or show AI running:

```bash
npx vitest run tests/fuzz/foods.fuzz.test.ts
```

Say:

> Now the test is executing against the running API. It authenticates through the login endpoint, sends generated payloads to POST /api/foods, and checks whether the selected invariant holds.

Show:

* The selected invariant
* The number of generated runs
* The failed assertion, if any
* The shrunk payload
* The response status and body

---

## 13. Optional: Convert The Failure Into A Regression Test

> Once fuzzing finds the issue, I keep the smallest failing payload as a regression test. The fuzz test discovers the problem; the regression test protects against it coming back.

---

## 14. Close-Out Message

Say:

> This is the workflow I want to show: AI analyzes the real endpoint and discovers the invariants. QA chooses the invariant. AI generates and runs the fast-check test. fast-check explores many inputs and shrinks failures. Then AI summarizes the result as a QA finding.

Final teaching message:

> GenAI does not replace QA judgment. It accelerates endpoint analysis, invariant discovery, test generation, test execution, and result summaries. The human tester still chooses the risk, reviews the result, and decides whether the behavior is acceptable.


## Clip 3: GenAI For Accessibility Testing

Length: 5-6 minutes  
Format: short slides, then one live demo

### Slide 1: Accessibility Testing

Slide content:

- Accessibility testing checks whether people using keyboards, screen readers, zoom, high contrast, or voice control can complete key flows.
- WCAG = Web Content Accessibility Guidelines.
- This app targets WCAG 2.1 AA.
- AA target means Level A + Level AA requirements.

One example per WCAG level:

- A: form input has an associated label.
- AA: keyboard focus is clearly visible.
- AAA: very high text contrast, for example 7:1 for normal text.

Say:

> For this app, accessibility matters because users need to log meals, read nutrition feedback, and understand status messages reliably.

### Slide 2: Where GenAI Helps

Keep this slide simple: three practical examples.

1. Create a checklist from screenshot or user story
   - Give AI a screenshot, page description, or user story.
   - Ask what accessibility checks should be run.
   - Good for getting started when you are not an accessibility expert.

2. Explain tool output and report a defect
   - Paste axe or Lighthouse results.
   - Ask AI to explain findings, group duplicates, and draft a defect report.
   - Good for turning noisy scan output into actionable QA work.

3. AI-guided automated check
   - Use an AI agent to run a Playwright + axe-core accessibility check.
   - axe-core finds issues; AI explains what they mean and creates the report.
   - Good for a fast first pass on the current page.

Say:

> For this demo, I am choosing Playwright plus axe-core. That is specific, repeatable, and close to how teams automate accessibility regression checks.

Example prompt for the AI agent:

```text
Use Playwright with axe-core to run an automated accessibility check against http://localhost:3737/log.

Report:
- axe violations found
- affected elements/selectors
- likely WCAG A/AA area
- what each issue means in plain QA language
- recommended defect summary
- what still needs manual keyboard or screen-reader verification
```

Say:

> This is where AI plugins or browser agents become useful. They can drive the browser or trigger tools, but the accessibility result still comes from industry tools such as axe, Lighthouse, Playwright checks, and manual screen-reader or keyboard testing.

### Slide 3: Popular AI + Accessibility Tool Setups

Slide content:

| Setup | Why use it | How AI helps |
| --- | --- | --- |
| AI + axe MCP Server | Plugin-style setup where AI can call checks. | Runs axe-style checks and summarizes results. |
| AI + axe-core MCP | Plugin-style setup where AI can call checks. | Runs axe-style checks and summarizes results. |
| AI + Lighthouse MCP | Plugin-style setup where AI can call checks. | Runs axe-style checks and summarizes results. |
| AI + axe-core + Playwright | Best for regression automation. | Generates tests, explains failures, drafts reports. |

Say:

> If I had to pick one setup for this demo, I would use axe DevTools plus AI explanation/reporting. If the AI environment supports plugins or MCP, axe MCP is the cleaner AI-agent version. For automation, Playwright plus axe-core is the regression path.

Setup notes:

- axe DevTools + axe Assistant: install the axe DevTools browser extension, open the app page, run a scan from DevTools, then use axe Assistant or paste the result into your LLM to explain and report it.
- AI agent/IDE + axe MCP Server: install/configure the axe MCP server in the AI tool or IDE that supports MCP, then ask the agent to run accessibility checks against the current page or local URL.
- Playwright + axe-core + AI: add Playwright and axe-core or `@axe-core/playwright` to the test project, then ask AI to generate a regression test that opens the page and runs axe checks.
- Lighthouse/WAVE + ChatGPT/Claude/Gemini: run Lighthouse from Chrome DevTools or WAVE from the browser extension, export/copy the results, then paste them into the LLM for explanation and defect drafting.

### Demo: Playwright + axe-core Check With AI Report

Goal: show one practical workflow: AI runs or helps run accessibility check, then creates a tester-friendly report.

Use the current app page, for example `http://localhost:3737/log`.

#### Step 1: Ask AI/Plugin To Run The Check

Show the Log Food page in the browser.

Prompt:

```text
Run accessibility check against http://localhost:3737/log.

Use axe-core rules for WCAG 2.1 A and AA.

Report:
- axe violations found
- affected elements/selectors
- likely WCAG A/AA area
- what each issue means in plain QA language
- recommended manual follow-up checks
```

What to say:

> The important point is that I picked a concrete setup: Playwright plus axe-core. AI is helping run or interpret a real automated check.

#### Step 2: Ask AI To Explain And Prioritize Results

Prompt:

```text
Here are the automated accessibility check results:

[paste Lighthouse/axe output]

Please:
1. summarize the findings in plain language
2. group duplicate or related issues
3. identify the highest-priority issue
4. explain user impact
5. map likely WCAG level: A, AA, or unknown
6. list what I still need to verify manually
```

What to say:

> This is useful because scanner output is often noisy. AI turns it into something a tester can act on.

#### Step 3: Ask AI To Create A Report Or Defect

Prompt:

```text
Create a concise accessibility report from these results.

Include:
- page tested
- tool used
- summary
- confirmed automated findings
- likely WCAG level
- user impact
- recommended manual checks
- suggested regression test

Then write one defect report for the highest-priority issue with:
- title
- steps to reproduce
- expected result
- actual result
- impact
- evidence from the tool output
```

Close:

> In this demo, GenAI helped operate or interpret an automated checker and turn the result into a report. The final decision still depends on real verification with keyboard, browser accessibility inspection, or screen reader testing.

---

## Clip 4: GenAI For Localization And Internationalization Testing

Length: 5-6 minutes  
Format: slides only

### Slide 1: Localization Testing

Slide content:

- Localization testing is more than translation.
- It checks language, dates, numbers, units, text expansion, locale behavior, and regional expectations.
- Internationalization checks whether the app is built so localization can work.

Meal app examples:

- Metric vs imperial units.
- `1.5` vs `1,5` decimal input.
- Date display consistency.
- Hardcoded English text.

Say:

> For a meal app, localization mistakes can change the meaning of quantities, dates, and user feedback.

### Slide 2: GenAI Approach To I18n Testing

Slide content:

- Step 1: Give AI requirements, supported locales, and source files.
- Step 2: Ask AI to scan for i18n risk patterns.
- Step 3: Ask AI to output a report with file evidence.
- Step 4: Ask AI to turn the report into a checklist and regression ideas.
- Step 5: Tester/dev team verifies findings later in app or automation.

Why it matters:

- Non-experts often do not know where localization bugs hide.
- AI can inspect code for hardcoded strings, hardcoded units, date formatting, number parsing, missing translation resources, and inconsistent locale usage.
- This works even before translated builds are ready.

Say:

> I am not asking AI to explain i18n theory or browse the app. I am using AI to scan the source and produce a localization risk report.

Prompt:

```text
Act as a localization QA engineer reviewing source code.

App context:
Meal Tracker lets users log foods by amount and date. It shows calories, macro values, food database values, meal history, and feedback.

Supported test profiles:
- Alice: en-US, metric
- Bob: en-US, imperial
- Carol: de-DE, metric

Pages:
- Dashboard
- Log Food
- Foods
- History

Inputs I will provide:
- PRD localization requirements
- user story US-11
- relevant page/component files
- formatting utility files
- translation/resource files, if they exist

Return:
1. source-code i18n risk areas
2. exact file/function/component evidence
3. why each risk matters
4. missing translation/resource structure, if any
5. recommended checklist items
6. regression test ideas

Focus on date formats, decimal separators, units, text externalization, long text, and locale-specific behavior. Do not give generic localization theory.
```

Speaker note:

- References like W3C i18n, Unicode CLDR/ICU, and BCP 47 matter in the background, but do not make the recording about them.
- For this app, the practical focus is runtime behavior: units, dates, numbers, and visible text.

### Slide 3: Where GenAI Helps

Use three real-world examples:

1. AI LQA for translated strings
   - Tools like Lokalise AI LQA, Crowdin AI QA/proofreading, Smartling AI quality features, and Phrase QA help review translations.
   - AI checks terminology, placeholders, missing variables, tone/style, and likely mistranslations.
   - Useful when the app already has translated strings.

2. AI source-code i18n scan
   - Give AI the requirements and relevant files.
   - Ask it to scan for hardcoded strings, unit labels, date formatting, number parsing, and missing translation files.
   - Useful before running the app or before translations exist.

3. AI-generated report/checklist
   - Ask AI to turn the scan into a QA report.
   - Output: risk, evidence, affected page, user impact, checklist item, and regression idea.
   - Useful because it gives testers a concrete plan without requiring i18n expertise.

Prompt for example 2:

```text
Scan the Meal Tracker source code for localization and internationalization risks.

Requirements:
- metric and imperial units must be respected
- dates should be displayed consistently
- numbers should respect locale
- comma decimal input should be supported for comma-decimal locales
- user-facing text should be externalizable

First, discover the relevant files yourself.
Search for:
- localization requirements and user stories
- user locale and unit preference fields
- formatting utilities
- date formatting calls
- number parsing
- hardcoded unit labels
- translation/resource files or i18n setup
- UI pages/components that display dates, units, food amounts, calories, and history

Return a concise report with:
1. files inspected
2. source evidence
3. risk
4. affected user/page
5. why it matters
6. checklist item for QA
7. suggested regression test
```

### Slide 4: AI + Localization Tool Setups

| Setup | How AI Helps |
| --- | --- |
| Lokalise AI LQA | Automated AI review of translation quality; can flag issues and route weak translations to human review. |
| Crowdin AI + QA checks | AI translation/proofreading plus automatic QA for placeholders, length, consistency, and in-context preview. |
| Smartling AI quality features | AI and quality checks enforce glossary, style rules, translation memory, and locale rules. |
| Phrase Strings + QA / Language AI | String management with QA checks, contextual previews, AI translation support, and quality scoring. |
| AI code agent + repo search | Scans source for hardcoded strings, date formatting, number parsing, hardcoded units, missing translation files. |
| i18next / FormatJS extraction reports + AI | AI reviews extracted/missing keys and helps identify hardcoded text or untranslated strings. |
| Pseudolocalization build/report + AI | AI summarizes hardcoded strings and layout-expansion risks found by pseudo builds. |
| Playwright locale/timezone + AI | AI generates later automation for date, time, number, decimal, and unit checks. |

Say:

> For this clip, the most relevant setup is an AI code agent scanning the repo and producing a localization risk report. Translation platforms matter when translated strings already exist.

### Slide 5: Source Analysis Prompt For This App

Use this as the main slide prompt:

```text
Act as a localization QA engineer reviewing a Next.js source codebase.

Product context:
Meal Tracker is a web app where users log foods, grams/amounts, meal type, and date. The app shows calories, macros, food history, and food database values.

Supported test locales/profiles for this release:
- en-US + metric: Alice
- en-US + imperial: Bob
- de-DE + metric: Carol

Pages in scope:
- Dashboard: today’s calories, macro grams, meal entries, date header
- Log Food: date input, meal type, food search, amount input, add button
- Foods: food table, nutrition values, “per 100g” labels
- History: date list, daily summaries, calorie/macro values

Requirements:
- Bob should see imperial weight/serving labels consistently where user-facing weights are shown.
- Carol’s de-DE locale should use comma decimal behavior where decimal input/display is supported.
- Dates should be displayed consistently across Dashboard and History according to the product requirement.
- User-facing text should be externalizable; hardcoded English should be flagged as an i18n readiness risk.

First, discover the relevant files yourself. Search the repo for:
- localization requirements and user stories
- user locale and unit preference fields
- formatting utilities
- UI pages/components that display dates, units, food amounts, calories, and history
- translation/resource files or i18n setup, if any

Then scan for:
- hardcoded user-facing English
- hardcoded units like g, grams, per 100g, kcal labels
- direct date formatting or raw ISO date display
- parseFloat / number parsing that may reject comma decimals
- missing use of locale or unitSystem
- missing translation/resource structure
- places where long translated strings could break layout

Return:
1. files discovered and why they were relevant
2. localization risk report with file/function evidence
3. severity/priority
4. user impact
5. source-code checklist for QA review
6. recommended defect for the highest-priority issue
7. suggested automated checks for date, unit, and decimal behavior

Do not browse the app. Base the report only on requirements and source-code evidence.
```

Say:

> This is the key workflow for this clip: AI scans source evidence first, then produces a localization report and checklist.

### Slide 6: Example Report Output

Show a compact report shape:

| Finding | Evidence | Risk | QA Checklist |
| --- | --- | --- | --- |
| Hardcoded units | UI code contains `g` / `per 100g` labels | Imperial users may see metric labels | Check Bob/unit preference across Dashboard, Log, Foods, History |
| Locale-insensitive decimal parsing | Utility uses `parseFloat` or number input assumptions | `1,5` may parse incorrectly | Add comma-decimal test for Carol/de-DE |
| Inconsistent date formatting | Pages format dates independently | Same date may display differently | Check Dashboard vs History date display |

### Slide 7: AI For Defect And Automation Ideas

Prompt:

```text
Here is the AI-generated localization source report:

[paste report]

Turn it into:
1. one concise defect report for the highest-priority risk
2. a QA checklist for manual verification
3. Playwright automation ideas for units, dates, and comma-decimal behavior
```

Say:

> This is useful because AI turns source-code evidence into QA artifacts: a report, a checklist, a defect, and automation ideas.

### Closing

Say:

> For localization, GenAI is useful in three practical ways: reviewing translated strings, scanning source code for i18n risks, and turning findings into reports, checklists, and defects.
