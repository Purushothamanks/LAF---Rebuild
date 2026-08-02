const express = require('express');
const router = express.Router();
const { getLatestTrends } = require('../services/trendEngine');

/**
 * GET /api/trends
 * Fetch live world trends & auto updates
 */
router.get('/', async (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const trends = await getLatestTrends(force);
    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      count: trends.length,
      trends
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch global trends' });
  }
});

module.exports = router;
