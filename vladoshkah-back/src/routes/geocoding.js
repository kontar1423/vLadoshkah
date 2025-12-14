import express from 'express';
import logger from '../logger.js';

const router = express.Router();

const CACHE_TTL_MS = Number(process.env.GEOCODING_CACHE_TTL_MS) || 1000 * 60 * 60 * 6; // 6 hours
const REQUEST_TIMEOUT_MS = Number(process.env.GEOCODING_TIMEOUT_MS) || 10000; // 10 seconds

const cache = new Map();
const pendingRequests = new Map();

const getCacheKey = (address = '') => address.trim().toLowerCase();

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
};

router.get('/coordinates', async (req, res) => {
  const address = (req.query.address || '').trim();

  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }

  const cacheKey = getCacheKey(address);

  const cached = getFromCache(cacheKey);
  if (cached) {
    logger.info({ address }, 'Geocoding cache hit');
    return res.json(cached);
  }

  if (pendingRequests.has(cacheKey)) {
    logger.debug({ address }, 'Geocoding wait for in-flight request');
    try {
      const result = await pendingRequests.get(cacheKey);
      return res.json(result);
    } catch (error) {
      logger.warn({ address, error }, 'Geocoding in-flight request failed');
      return res.json(null);
    }
  }

  const fetchPromise = (async () => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

      logger.info({ address, url: nominatimUrl }, 'Geocoding request');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response;
      try {
        response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'Vladoshkah App (contact@vladoshkah.ru)',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.warn({
          status: response.status,
          statusText: response.statusText,
          errorText,
          address
        }, 'Nominatim API returned non-OK status');

        return null;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logger.warn({ error: parseError, address, responseStatus: response.status }, 'Failed to parse Nominatim response');
        return null;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        logger.warn({ address, dataLength: data?.length }, 'No results from Nominatim');
        return null;
      }

      const result = data[0];
      if (!result.lat || !result.lon) {
        logger.warn({ address, result }, 'Invalid result from Nominatim (missing lat/lon)');
        return null;
      }

      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        logger.warn({ address, lat: result.lat, lon: result.lon }, 'Invalid coordinates from Nominatim');
        return null;
      }

      logger.info({ address, lat, lng }, 'Geocoding success');
      return { lat, lng };
    } catch (error) {
      if (error.name === 'AbortError') {
        logger.warn({ address }, 'Geocoding request timeout');
      } else {
        logger.warn({ error, address, errorName: error.name }, 'Geocoding request failed');
      }

      return null;
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);

  try {
    const result = await fetchPromise;
    if (result) {
      setCache(cacheKey, result);
    }
    return res.json(result);
  } catch (error) {
    logger.error({ error, stack: error.stack, address: req.query.address }, 'Unexpected geocoding error');
    return res.json(null);
  } finally {
    pendingRequests.delete(cacheKey);
  }
});

export default router;
