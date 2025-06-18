// backend/routes/apiDataForSEO.js
import express from 'express';
import { getKeywordMetrics } from '../services/providers/DataForSEOProvider.js';

const router = express.Router();

// GET /api/dataforseo/metrics?keywords=plumber,electrician&location=Portland
router.get('/metrics', async (req, res) => {
  try {
    const { keywords, location } = req.query;
    if (!keywords || !location) {
      return res.status(400).json({ error: 'Missing keywords or location' });
    }

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const metrics = await getKeywordMetrics(keywordList, location);

    res.json(metrics);
  } catch (err) {
    console.error('❌ /metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch keyword metrics' });
  }
});

// Other routes (e.g. /serp-insights) remain unchanged
export default router;
