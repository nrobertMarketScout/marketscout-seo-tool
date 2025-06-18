// backend/routes/apiDataForSEO.js
import express from 'express';
import { KeywordService } from '../services/KeywordService.js';
import { getKeywordStats } from '../providers/keywordStatsProvider.js';
import { scoreKeyword } from '../utils/scoring.js';

const router = express.Router();

const keywordService = new KeywordService(
  { getKeywordMetrics: getKeywordStats },
  {} // placeholder for serpProvider if needed later
);

// GET /api/dataforseo/metrics?keywords=plumber,electrician&location=Portland, OR
router.get('/metrics', async (req, res) => {
  try {
    const { keywords, location } = req.query;
    if (!keywords || !location) {
      return res.status(400).json({ error: 'Missing keywords or location' });
    }

    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const metrics = await keywordService.getKeywordMetrics(keywordList, location);

    const withScores = metrics.map(metric => {
      return {
        ...metric,
        score: scoreKeyword(metric)
      };
    });

    res.json(withScores);
  } catch (err) {
    console.error('❌ /metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch keyword metrics' });
  }
});

export default router;
