const express = require('express');
const router = express.Router();
const geocodingService = require('../services/geocodingService');

// Geocoding service for address lookup
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required.' });
    }
    const data = await geocodingService.searchAddress(q);
    res.json(data);
  } catch (error) {
    next(error); // Pass error to the centralized error handler
  }
});

// Reverse geocoding for coordinates to address
router.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude query parameters are required.' });
    }
    const data = await geocodingService.reverseGeocode(lat, lon);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;