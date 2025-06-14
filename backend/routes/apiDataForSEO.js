import express from 'express';
import { keywordService } from '../services/index.js';

const router = express.Router();

router.get('/keyword-data', async (req, res) => {
  try {
    const { keywords, location } = req.query; // comma-separated keywords
    const keywordList = keywords.split(',');

    const metrics = await keywordService.getKeywordMetrics(keywordList, location);
    res.json(metrics);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/serp-insights', async (req, res) => {
  try {
    const { keyword, location } = req.query;

    const serpData = await keywordService.getSERPInsights(keyword, location);
    res.json(serpData);
  } catch (error) {
    console.error('SERP API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
