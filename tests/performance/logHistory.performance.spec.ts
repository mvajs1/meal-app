import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import autocannon from 'autocannon';

const REPORT_PATH = path.resolve(
  process.cwd(),
  'reports/logHistory-performance-test-result.json'
);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type StepResult = {
  concurrency: number;
  requestsPerSecond: number;
  latencyMs: {
    p50: number;
    p97_5: number;
    p99: number;
  };
  requests: number;
  non2xx: number;
  errors: number;
  errorRatePercent: number;
  healthy: boolean;
  tripReasons: string[];
};

type Report = {
  generatedAt: string;
  status: 'running' | 'completed' | 'failed';
  config: ReturnType<typeof readConfig>;
  preflight?: { status: number };
  steps: StepResult[];
  lastHealthy: StepResult | null;
  firstDegraded: StepResult | null;
  stopReason: string | null;
  failure?: string;
};

function dateDaysAgo(days: number): string {
  const date = new Date();
  const utcToday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  utcToday.setUTCDate(utcToday.getUTCDate() - days);
  return utcToday.toISOString().slice(0, 10);
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number; received "${raw}".`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = positiveNumber(name, fallback);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer; received "${process.env[name]}".`);
  }
  return value;
}

function dateEnv(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (!ISO_DATE.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD; received "${value}".`);
  }
  return value;
}

function readConfig() {
  const config = {
    baseUrl: (process.env.PERF_BASE_URL ?? 'http://localhost:3737').replace(/\/$/, ''),
    email: process.env.PERF_EMAIL ?? 'alice@carvedrock.com',
    password: process.env.PERF_PASSWORD ?? 'password123',
    from: dateEnv('PERF_FROM', dateDaysAgo(365)),
    to: dateEnv('PERF_TO', dateDaysAgo(0)),
    startConcurrency: positiveInteger('PERF_START_CONCURRENCY', 1),
    maxConcurrency: positiveInteger('PERF_MAX_CONCURRENCY', 128),
    stepMultiplier: positiveNumber('PERF_STEP_MULTIPLIER', 2),
    durationSeconds: positiveInteger('PERF_DURATION_SECONDS', 5),
    requestTimeoutSeconds: positiveInteger('PERF_REQUEST_TIMEOUT_SECONDS', 10),
    p97_5ThresholdMs: positiveNumber('PERF_P97_5_THRESHOLD_MS', 300),
    errorRateThresholdPercent: positiveNumber(
      'PERF_ERROR_RATE_THRESHOLD_PERCENT',
      1
    ),
  };

  if (config.from > config.to) {
    throw new Error(`PERF_FROM (${config.from}) must not be after PERF_TO (${config.to}).`);
  }
  if (config.startConcurrency > config.maxConcurrency) {
    throw new Error(
      'PERF_START_CONCURRENCY must be less than or equal to PERF_MAX_CONCURRENCY.'
    );
  }
  if (config.stepMultiplier <= 1) {
    throw new Error('PERF_STEP_MULTIPLIER must be greater than 1.');
  }

  return config;
}

async function persistReport(report: Report) {
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function login(config: ReturnType<typeof readConfig>): Promise<string> {
  const response = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });

  assert.equal(
    response.status,
    200,
    `Login failed with ${response.status}: ${await response.text()}`
  );

  const setCookie = response.headers.get('set-cookie');
  const sessionCookie = setCookie?.match(/(?:^|,\s*)(session_token=[^;,\s]+)/)?.[1];
  assert.ok(sessionCookie, 'Login response did not set the session_token cookie.');
  return sessionCookie;
}

function printStep(step: StepResult) {
  console.log(
    [
      `concurrency=${step.concurrency}`,
      `requests/sec=${step.requestsPerSecond.toFixed(2)}`,
      `p50=${step.latencyMs.p50.toFixed(2)}ms`,
      `p97.5=${step.latencyMs.p97_5.toFixed(2)}ms`,
      `p99=${step.latencyMs.p99.toFixed(2)}ms`,
      `non-2xx/error=${step.errorRatePercent.toFixed(2)}%`,
    ].join(' | ')
  );
}

function summarizeLevel(label: string, step: StepResult | null) {
  if (!step) {
    console.log(`${label}: not observed`);
    return;
  }

  const reason = step.tripReasons.length > 0 ? ` | reason=${step.tripReasons.join('; ')}` : '';
  console.log(
    `${label}: concurrency=${step.concurrency} | requests/sec=${step.requestsPerSecond.toFixed(
      2
    )} | p97.5=${step.latencyMs.p97_5.toFixed(2)}ms${reason}`
  );
}

async function main() {
  const config = readConfig();
  const report: Report = {
    generatedAt: new Date().toISOString(),
    status: 'running',
    config,
    steps: [],
    lastHealthy: null,
    firstDegraded: null,
    stopReason: null,
  };

  try {
    console.log(
      `Testing GET /api/food-log/history from=${config.from} to=${config.to}`
    );
    console.log(
      `Ramp: start=${config.startConcurrency}, multiplier=${config.stepMultiplier}, safety cap=${config.maxConcurrency}, window=${config.durationSeconds}s`
    );

    const sessionCookie = await login(config);
    const targetUrl = `${config.baseUrl}/api/food-log/history?from=${encodeURIComponent(
      config.from
    )}&to=${encodeURIComponent(config.to)}`;

    const preflight = await fetch(targetUrl, {
      headers: { cookie: sessionCookie },
    });
    report.preflight = { status: preflight.status };
    assert.equal(
      preflight.status,
      200,
      `Preflight failed with ${preflight.status}: ${await preflight.text()}`
    );
    console.log('Preflight: 200 OK');

    let previousStep: StepResult | null = null;
    let concurrency = config.startConcurrency;

    while (concurrency <= config.maxConcurrency) {
      const result = await autocannon({
        url: targetUrl,
        method: 'GET',
        headers: { cookie: sessionCookie },
        connections: concurrency,
        duration: config.durationSeconds,
        timeout: config.requestTimeoutSeconds,
        pipelining: 1,
      });

      const attempts = result.requests.total + result.errors;
      const problemRequests = result.non2xx + result.errors;
      const errorRatePercent =
        attempts === 0 ? 100 : (problemRequests / attempts) * 100;
      const tripReasons: string[] = [];

      if (result.latency.p97_5 > config.p97_5ThresholdMs) {
        tripReasons.push(
          `p97.5 ${result.latency.p97_5.toFixed(2)}ms > ${config.p97_5ThresholdMs}ms`
        );
      }
      if (errorRatePercent > config.errorRateThresholdPercent) {
        tripReasons.push(
          `error rate ${errorRatePercent.toFixed(2)}% > ${config.errorRateThresholdPercent}%`
        );
      }
      if (
        previousStep &&
        result.requests.average <= previousStep.requestsPerSecond &&
        result.latency.p97_5 > previousStep.latencyMs.p97_5
      ) {
        tripReasons.push(
          `throughput stopped increasing (${result.requests.average.toFixed(
            2
          )} <= ${previousStep.requestsPerSecond.toFixed(
            2
          )} req/s) while p97.5 rose (${result.latency.p97_5.toFixed(
            2
          )} > ${previousStep.latencyMs.p97_5.toFixed(2)}ms)`
        );
      }

      const step: StepResult = {
        concurrency,
        requestsPerSecond: result.requests.average,
        latencyMs: {
          p50: result.latency.p50,
          p97_5: result.latency.p97_5,
          p99: result.latency.p99,
        },
        requests: result.requests.total,
        non2xx: result.non2xx,
        errors: result.errors,
        errorRatePercent,
        healthy: tripReasons.length === 0,
        tripReasons,
      };

      report.steps.push(step);
      printStep(step);

      if (!step.healthy) {
        report.firstDegraded = step;
        report.stopReason = step.tripReasons.join('; ');
        break;
      }

      report.lastHealthy = step;
      previousStep = step;

      const nextConcurrency = Math.ceil(concurrency * config.stepMultiplier);
      if (nextConcurrency <= concurrency) {
        throw new Error('Concurrency ramp did not advance.');
      }
      concurrency = nextConcurrency;
    }

    if (!report.firstDegraded) {
      report.stopReason = `Safety cap ${config.maxConcurrency} reached without degradation`;
    }

    report.status = 'completed';
    summarizeLevel('LAST HEALTHY', report.lastHealthy);
    summarizeLevel('FIRST DEGRADED', report.firstDegraded);
    console.log(`STOP: ${report.stopReason}`);
  } catch (error) {
    report.status = 'failed';
    report.failure = error instanceof Error ? error.stack ?? error.message : String(error);
    throw error;
  } finally {
    await persistReport(report);
    console.log(`Results written to ${REPORT_PATH}`);
  }
}

main().catch((error) => {
  console.error('Performance test failed:', error);
  process.exitCode = 1;
});
