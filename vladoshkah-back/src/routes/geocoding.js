import express from 'express';
import logger from '../logger.js';

const router = express.Router();

router.get('/coordinates', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Vladoshkah App'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return res.json({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      });
    }
    
    return res.json(null);
  } catch (error) {
    logger.error(error, 'Geocoding error');
    return res.status(500).json({ error: 'Geocoding failed' });
  }
});

export default router;

