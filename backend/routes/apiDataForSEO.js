// backend/routes/apiDataForSEO.js
import express from 'express'
import { getKeywordMetrics } from '../services/providers/DataForSEOProvider.js';

const router = express.Router()

// GET /api/dataforseo/metrics?keywords=plumber,electrician&location=Portland
router.get('/metrics', async (req, res) => {
  try {
    const { keywords } = req.query
    if (!keywords) return res.status(400).json({ error: 'Missing keywords' })

    const keywordList = keywords.split(',').map(k => k.trim())
    const metrics = await DataForSEOProvider.getKeywordMetrics(keywordList)

    res.json(metrics)
  } catch (err) {
    console.error('❌ /metrics error:', err)
    res.status(500).json({ error: 'Failed to fetch keyword metrics' })
  }
})

// GET /api/dataforseo/serp-insights?keyword=plumber&location=Portland
router.get('/serp-insights', async (req, res) => {
  try {
    const { keyword, location } = req.query
    if (!keyword || !location) return res.status(400).json({ error: 'Missing keyword or location' })

    const insights = await DataForSEOProvider.getSERPInsights(keyword, location)

    // Patch: add empty fallback for snippet if missing
    insights.organicResults = insights.organicResults.map(r => ({
      ...r,
      snippet: r.snippet || ''
    }))

    res.json(insights)
  } catch (err) {
    console.error('❌ /serp-insights error:', err)
    res.status(500).json({ error: 'Failed to fetch SERP insights' })
  }
})

export default router
