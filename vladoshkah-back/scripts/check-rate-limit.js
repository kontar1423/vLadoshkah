import { setTimeout as sleep } from 'node:timers/promises';

const rawArgs = process.argv.slice(2);

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Boolean(value);
  if (typeof value === 'string') {
    if (['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase())) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(value.toLowerCase())) return false;
  }
  return fallback;
}

function camelize(flag) {
  return flag.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseArgs(tokens) {
  const parsed = {};
  const consumed = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('--')) continue;

    consumed.add(i);
    if (token.startsWith('--no-')) {
      parsed[camelize(token.slice(5))] = false;
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=');
    const key = camelize(rawKey);

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const maybeValue = tokens[i + 1];
    if (maybeValue && !maybeValue.startsWith('--')) {
      parsed[key] = maybeValue;
      consumed.add(i + 1);
      i += 1;
    } else {
      parsed[key] = true;
    }
  }

  const positional = tokens.filter((_, index) => !consumed.has(index) && !tokens[index].startsWith('--'));
  return { parsed, positional };
}

function printHelp() {
  console.log(`Usage: node scripts/check-rate-limit.js [target] [requests] [delayMs] [--options]

Arguments:
  target     Target URL (default from TARGET_URL or http://172.29.8.236:4000/api/animals)
  requests   Planned total requests (default TOTAL_REQUESTS or 1000)
  delayMs    Delay between requests in ms (default DELAY_MS or 1)

Options:
  --concurrency <n>    Parallel workers to send requests (default 1)
  --timeout <ms>       Per-request timeout in ms (default 10000)
  --method <verb>      HTTP method (default GET)
  --log-every <n>      Print progress every N completed requests (default 50)
  --stop-on-429        Stop as soon as first 429 is observed (default true)
  --no-stop-on-429     Continue even after 429
  --help               Show this message

Env:
  TARGET_URL, TOTAL_REQUESTS, DELAY_MS, AUTH_TOKEN, CONCURRENCY,
  TIMEOUT_MS, HTTP_METHOD, LOG_EVERY, STOP_ON_429`);
}

function readConfig() {
  const { parsed, positional } = parseArgs(rawArgs);
  if (parsed.help || parsed.h) {
    printHelp();
    process.exit(0);
  }

  const targetUrl =
    positional[0] ||
    parsed.target ||
    parsed.url ||
    process.env.TARGET_URL ||
    'http://172.29.8.236:4000/api/animals';
  const plannedRequests = toNumber(
    positional[1] || parsed.requests || process.env.TOTAL_REQUESTS,
    1000
  );
  const delayMs = toNumber(positional[2] || parsed.delay || process.env.DELAY_MS, 1);
  const concurrency = Math.max(
    1,
    toNumber(parsed.concurrency ?? process.env.CONCURRENCY, 1)
  );
  const timeoutMs = toNumber(parsed.timeout ?? process.env.TIMEOUT_MS, 10000);
  const authToken = process.env.AUTH_TOKEN;
  const method = String(parsed.method ?? process.env.HTTP_METHOD ?? 'GET').toUpperCase();
  const defaultLogEvery = Math.max(
    1,
    Math.min(50, Math.round(plannedRequests / 10) || 1)
  );
  const logEvery = Math.max(
    1,
    toNumber(parsed.logEvery ?? process.env.LOG_EVERY, defaultLogEvery)
  );
  const stopOn429 = toBool(parsed.stopOn429 ?? process.env.STOP_ON_429, true);

  return {
    targetUrl,
    plannedRequests,
    delayMs,
    concurrency,
    timeoutMs,
    authToken,
    method,
    logEvery,
    stopOn429,
  };
}

async function hitOnce({ targetUrl, authToken, method, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
    const res = await fetch(targetUrl, { method, headers, signal: controller.signal });

    const toInt = (name) => Number.parseInt(res.headers.get(name) ?? 'NaN', 10);

    return {
      status: res.status,
      limit: toInt('x-ratelimit-limit'),
      remaining: toInt('x-ratelimit-remaining'),
      reset: toInt('x-ratelimit-reset'),
      retryAfter: toInt('retry-after'),
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: 'error', message: `timeout after ${timeoutMs}ms` };
    }
    return { status: 'error', message: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function formatStatusMap(map) {
  return Array.from(map.entries())
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');
}

async function main() {
  const config = readConfig();
  const {
    targetUrl,
    plannedRequests,
    delayMs,
    concurrency,
    timeoutMs,
    authToken,
    method,
    logEvery,
    stopOn429,
  } = config;

  console.log(`Target: ${targetUrl}`);
  console.log(
    `Planned requests: ${plannedRequests} (delay ${delayMs}ms, concurrency ${concurrency}, method ${method})`
  );
  console.log(`Per-request timeout: ${timeoutMs}ms`);
  if (authToken) console.log('Using Authorization: Bearer <token>');
  if (!stopOn429) console.log('Will continue after 429 responses');

  const startedAt = Date.now();
  let first429Index = null;
  let advertisedLimit = null;
  let advertisedReset = null;

  const statusCounts = new Map();
  const errors = [];
  let sent = 0;
  let completed = 0;
  let shouldStop = false;

  async function worker(workerId) {
    while (!shouldStop) {
      const nextIndex = sent + 1;
      if (nextIndex > plannedRequests) break;
      sent += 1;

      const result = await hitOnce(config);
      completed += 1;

      statusCounts.set(result.status, (statusCounts.get(result.status) ?? 0) + 1);

      if (advertisedLimit === null && Number.isFinite(result.limit)) {
        advertisedLimit = result.limit;
      }
      if (advertisedReset === null && Number.isFinite(result.reset)) {
        advertisedReset = result.reset;
      }
      if (result.status === 'error') {
        errors.push({ index: nextIndex, message: result.message });
      }

      if (result.status === 429 && first429Index === null) {
        first429Index = nextIndex;
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
        const retryIn = result.retryAfter || result.reset;
        console.log(
          `429 reached at #${nextIndex} after ${elapsed}s${retryIn ? ` (retry in ~${retryIn}s)` : ''}`
        );
        if (stopOn429) {
          shouldStop = true;
        }
      }

      if (completed % logEvery === 0) {
        const elapsed = Date.now() - startedAt;
        const rpm = Math.round((completed / elapsed) * 60000);
        console.log(`[worker ${workerId}] done ${completed}/${plannedRequests}, approx ${rpm} rpm`);
      }

      if (shouldStop) break;
      if (delayMs > 0 && sent < plannedRequests) {
        await sleep(delayMs);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, index) => worker(index + 1));
  await Promise.all(workers);

  const elapsedMs = Date.now() - startedAt;
  const allowed = first429Index ? first429Index - 1 : completed;
  const approxRpm =
    elapsedMs > 0 ? Math.round((allowed / elapsedMs) * 60000) : allowed * 60000;

  console.log('---');
  console.log(`Advertised limit (X-RateLimit-Limit): ${advertisedLimit ?? 'n/a'}`);
  if (advertisedReset) {
    console.log(`Advertised reset (X-RateLimit-Reset): ${advertisedReset}s`);
  }
  console.log(`Allowed before first 429: ${allowed}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`Status counts: ${formatStatusMap(statusCounts) || 'n/a'}`);
  if (errors.length) {
    console.log(
      `Errors (${errors.length}): ${errors
        .map((err) => `#${err.index} ${err.message}`)
        .join('; ')}`
    );
  }
  console.log(`Approx effective rpm: ${approxRpm} (based on this run)`);
}

main().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
