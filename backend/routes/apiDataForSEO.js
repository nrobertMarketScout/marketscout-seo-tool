// backend/routes/apiDataForSEO.js
import express from 'express'
import { DataForSEOProvider } from '../services/providers/DataForSEOProvider.js'

const router = express.Router()

router.post('/metrics', async (req, res) => {
  try {
    const { keywords } = req.body
    const result = await DataForSEOProvider.getKeywordMetrics(keywords)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch keyword metrics' })
  }
})

router.post('/serp', async (req, res) => {
  try {
    const { keyword } = req.body
    const result = await DataForSEOProvider.getSERPInsights(keyword)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SERP insights' })
  }
})

export default router
