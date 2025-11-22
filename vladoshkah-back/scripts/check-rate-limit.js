import { setTimeout as sleep } from 'node:timers/promises';

const targetUrl = process.argv[2] || process.env.TARGET_URL || 'http://172.29.8.236:4000/api/animals';
const plannedRequests = Number(process.argv[3] || process.env.TOTAL_REQUESTS || 1000);
const delayMs = Number(process.argv[4] || process.env.DELAY_MS || 1);
const authToken = process.env.AUTH_TOKEN;

async function hitOnce() {
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
  const res = await fetch(targetUrl, { method: 'GET', headers });

  return {
    status: res.status,
    limit: Number.parseInt(res.headers.get('x-ratelimit-limit') ?? 'NaN', 10),
    remaining: Number.parseInt(res.headers.get('x-ratelimit-remaining') ?? 'NaN', 10),
    reset: Number.parseInt(res.headers.get('x-ratelimit-reset') ?? 'NaN', 10),
    retryAfter: Number.parseInt(res.headers.get('retry-after') ?? 'NaN', 10),
  };
}

async function main() {
  console.log(`Target: ${targetUrl}`);
  console.log(`Planned requests: ${plannedRequests} (delay ${delayMs}ms)`);
  if (authToken) console.log('Using Authorization: Bearer <token>');

  const startedAt = Date.now();
  let first429Index = null;
  let advertisedLimit = null;

  for (let i = 1; i <= plannedRequests; i++) {
    const result = await hitOnce();

    if (advertisedLimit === null && Number.isFinite(result.limit)) {
      advertisedLimit = result.limit;
    }

    if (result.status === 429) {
      first429Index = i;
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
      console.log(`429 reached at request #${i} after ${elapsed}s (retry ${result.retryAfter || result.reset || 'n/a'}s)`);
      break;
    }

    if (delayMs > 0 && i !== plannedRequests) {
      await sleep(delayMs);
    }
  }

  const elapsedMs = Date.now() - startedAt;
  const allowed = first429Index ? first429Index - 1 : plannedRequests;

  console.log('---');
  console.log(`Advertised limit (X-RateLimit-Limit): ${advertisedLimit ?? 'n/a'}`);
  console.log(`Allowed before first 429: ${allowed}`);
  console.log(`Elapsed: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(
    `Approx effective rpm: ${Math.round((allowed / elapsedMs) * 60000)} (based on this run)`
  );
}

main().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
