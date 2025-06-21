// backend/api/matrix.js
import express from 'express'
import { getKeywordStats } from '../providers/keywordStatsProvider.js'
import { getSERPEnrichment } from '../services/providers/serpEnrichmentProvider.js'

const router = express.Router()

function scoreKeyword({ volume, cpc, competition, hasMapPack, mapPackOverlap, mapPackWeak }) {
  let score = 0
  const breakdown = []

  // Search Volume
  if (volume >= 500) {
    score += 2
    breakdown.push('Search volume: +2 (≥500)')
  } else if (volume >= 100) {
    score += 1
    breakdown.push('Search volume: +1 (100–499)')
  } else {
    breakdown.push('Search volume: +0 (<100)')
  }

  // CPC
  if (cpc < 5) {
    score += 2
    breakdown.push('CPC: +2 (<$5)')
  } else if (cpc < 10) {
    score += 1
    breakdown.push('CPC: +1 ($5–10)')
  } else {
    breakdown.push('CPC: +0 (>$10)')
  }

  // Competition
  if (typeof competition === 'number') {
    if (competition < 0.3) {
      score += 2
      breakdown.push('Competition: +2 (<0.3)')
    } else if (competition < 0.6) {
      score += 1
      breakdown.push('Competition: +1 (0.3–0.6)')
    } else {
      breakdown.push('Competition: +0 (≥0.6)')
    }
  } else {
    breakdown.push('Competition: +0 (unknown)')
  }

  // Placeholder Ads Density
  breakdown.push('Ads density: +0 (0 or 5+ ads)')

  // Map Pack & Organic Overlap
  if (!hasMapPack) {
    score += 2
    breakdown.push('Map Pack & Organic overlap: +2 (no overlap)')
    breakdown.push('Map Pack: +2 (absent)')
  } else if (mapPackOverlap > 1 && mapPackWeak === 0) {
    score -= 2
    breakdown.push('Map Pack & Organic overlap: -2 (strong overlap)')
  } else if (mapPackOverlap === 1 && mapPackWeak > 0) {
    score += 1
    breakdown.push('Map Pack & Organic overlap: +1 (weak single overlap)')
  } else {
    score += 2
    breakdown.push('Map Pack & Organic overlap: +2 (minimal overlap)')
  }

  return { score, breakdown }
}

router.post('/', async (req, res) => {
  const { keywords = [], locationCodes = [], locationName = '' } = req.body

  if (!Array.isArray(keywords) || keywords.length === 0 || !Array.isArray(locationCodes) || locationCodes.length === 0) {
    return res.status(400).json({ error: 'Missing keywords or locationCodes' })
  }

  try {
    const matrix = []

    for (const locationCode of locationCodes) {
      const stats = await getKeywordStats(keywords, locationCode)

      for (const row of stats) {
        const keyword = row.keyword
        const serp = await getSERPEnrichment(keyword, locationCode) || {}

        const hasMapPack = serp.hasMapPack ?? false
        const mapPackOverlap = serp.mapPackOverlap ?? 0
        const mapPackWeak = serp.mapPackWeak ?? 0

        const enriched = {
          ...row,
          hasMapPack,
          mapPackOverlap,
          mapPackWeak
        }

        const { score, breakdown } = scoreKeyword(enriched)

        matrix.push({
          keyword,
          location: row.location || locationName || '',
          volume: row.volume,
          cpc: row.cpc,
          competition: row.competition,
          hasMapPack,
          mapPackOverlap,
          mapPackWeak,
          score,
          score_breakdown: breakdown
        })
      }
    }

    res.json({ matrix })
  } catch (err) {
    console.error('❌ /api/matrix error:', err)
    res.status(500).json({ error: 'Failed to process matrix' })
  }
})

export default router
