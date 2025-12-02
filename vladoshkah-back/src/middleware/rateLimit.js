import redisClient from '../cache/redis-client.js';
import logger from '../logger.js';

const memoryStore = new Map();

function setRateHeaders(res, maxRequests, count, ttlSeconds) {
  const reset = Math.ceil(Date.now() / 1000) + ttlSeconds;
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(maxRequests - count, 0));
  res.setHeader('X-RateLimit-Reset', reset);
}

async function consumeRedis(key, windowSeconds) {
  const client = redisClient.client;
  const current = await client.incr(key);

  if (current === 1) {
    await client.expire(key, windowSeconds);
    return { count: current, ttl: windowSeconds };
  }

  let ttl = await client.ttl(key);
  if (ttl <= 0) {
    await client.expire(key, windowSeconds);
    ttl = windowSeconds;
  }

  return { count: current, ttl };
}

function consumeMemory(key, windowSeconds) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cached = memoryStore.get(key);

  if (!cached || cached.expiresAt <= now) {
    const expiresAt = now + windowMs;
    memoryStore.set(key, { count: 1, expiresAt });
    return { count: 1, ttl: windowSeconds };
  }

  const count = cached.count + 1;
  memoryStore.set(key, { count, expiresAt: cached.expiresAt });
  const ttl = Math.max(Math.ceil((cached.expiresAt - now) / 1000), 1);

  return { count, ttl };
}

function createRateLimiter(options = {}) {
  const {
    windowSeconds = 60,
    maxRequests = 100,
    keyPrefix = 'rl',
    keyGenerator = (req) => req.ip || 'unknown',
    skip = () => false
  } = options;

  return async function rateLimiter(req, res, next) {
    try {
      if (skip(req) || process.env.NODE_ENV === 'test') {
        return next();
      }

      const key = `${keyPrefix}:${keyGenerator(req)}`;
      const canUseRedis = redisClient.isConnected() && redisClient.client?.isOpen;
      const { count, ttl } = canUseRedis
        ? await consumeRedis(key, windowSeconds)
        : consumeMemory(key, windowSeconds);

      setRateHeaders(res, maxRequests, count, ttl);

      if (count > maxRequests) {
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: ttl
        });
      }

      return next();
    } catch (error) {
      logger.warn(error, 'Rate limiter failed, allowing request');
      return next();
    }
  };
}

export default createRateLimiter;
