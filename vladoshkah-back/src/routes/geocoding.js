import express from 'express';
import logger from '../logger.js';

const router = express.Router();

router.get('/coordinates', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const encodedAddress = encodeURIComponent(address);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    logger.info({ address, url: nominatimUrl }, 'Geocoding request');

    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

    let response;
    try {
      response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Vladoshkah App (contact@vladoshkah.ru)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logger.error({ address }, 'Geocoding request timeout');
        return res.status(504).json({ 
          error: 'Geocoding request timeout',
          details: 'The request took too long to complete'
        });
      }
      
      logger.error({ error: fetchError, address, errorName: fetchError.name }, 'Failed to fetch from Nominatim');
      return res.status(500).json({ 
        error: 'Failed to connect to geocoding service',
        details: fetchError.message 
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error({ 
        status: response.status, 
        statusText: response.statusText,
        errorText,
        address 
      }, 'Nominatim API error');
      
      // Если это rate limit (429), возвращаем специальный статус
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Too many requests to geocoding service. Please try again later.' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Geocoding service error',
        details: `HTTP ${response.status}: ${response.statusText}`
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      logger.error({ error: parseError, address, responseStatus: response.status }, 'Failed to parse Nominatim response');
      return res.status(500).json({ 
        error: 'Invalid response from geocoding service',
        details: parseError.message 
      });
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      logger.warn({ address, dataLength: data?.length }, 'No results from Nominatim');
      return res.json(null);
    }

    const result = data[0];
    if (!result.lat || !result.lon) {
      logger.warn({ address, result }, 'Invalid result from Nominatim (missing lat/lon)');
      return res.json(null);
    }

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lng)) {
      logger.warn({ address, lat: result.lat, lon: result.lon }, 'Invalid coordinates from Nominatim');
      return res.json(null);
    }

    logger.info({ address, lat, lng }, 'Geocoding success');
    
    return res.json({
      lat,
      lng
    });
  } catch (error) {
    logger.error({ error, stack: error.stack, address: req.query.address }, 'Unexpected geocoding error');
    return res.status(500).json({ 
      error: 'Geocoding failed',
      details: error.message 
    });
  }
});

export default router;

