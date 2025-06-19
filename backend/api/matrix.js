// backend/api/matrix.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { getKeywordStats } from '../providers/keywordStatsProvider.js'
import { scoreKeyword } from '../utils/scoring.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const matrixInputPath = path.resolve(__dirname, '../data/input.csv')

// In-memory cache to reduce API calls (keyword::location)
const metricsCache = new Map()

router.get('/', async (req, res) => {
  try {
    const csv = await fs.readFile(matrixInputPath, 'utf-8')
    const { data: rawRows, meta } = Papa.parse(csv, { header: true })

    // Normalize headers to lowercase
    const headersMap = meta.fields.reduce((map, h) => {
      map[h.toLowerCase()] = h
      return map
    }, {})

    const rows = rawRows.map(row => ({
      keyword: row[headersMap['keyword']],
      location: row[headersMap['location']]
    }))

    const filteredRows = rows.filter(row => {
      const isValid = row.keyword && row.location
      if (!isValid) {
        console.warn('❌ Skipping invalid row in CSV:', row)
      }
      return isValid
    })

    const enriched = await Promise.all(
      filteredRows.map(async ({ keyword, location }) => {
        const cacheKey = `${keyword.toLowerCase()}::${location.toLowerCase()}`
        const now = Date.now()
        const ttl = 24 * 60 * 60 * 1000

        let metric

        if (metricsCache.has(cacheKey)) {
          const { data, timestamp } = metricsCache.get(cacheKey)
          if (now - timestamp < ttl) {
            console.log(`[Cache] ✅ Using cached metrics for ${cacheKey}`)
            metric = data
          } else {
            metricsCache.delete(cacheKey)
          }
        }

        if (!metric) {
          try {
            const [result] = await getKeywordStats([keyword], location)
            metric = result
            metricsCache.set(cacheKey, { data: result, timestamp: now })
            console.log(`[API] ✅ Pulled metrics for ${keyword} in ${location}:`, result)
          } catch (err) {
            console.warn(`⚠️ Metric fetch failed for ${keyword} in ${location}: ${err.message}`)
            metric = { volume: 0, cpc: 0, competition: 0 }
          }
        }

        const score = scoreKeyword({
          search_volume: metric.volume,
          cpc: metric.cpc,
          competition: metric.competition,
          hasMapPack: false // Placeholder for now
        })

        return {
          keyword,
          location,
          volume: metric.volume,
          cpc: metric.cpc,
          competition: metric.competition,
          score
        }
      })
    )

    console.log('🔍 Final Enriched Matrix:', enriched)
    res.json({ matrix: enriched })
  } catch (err) {
    console.error('❌ Failed to generate matrix:', err)
    res.status(500).json({ error: 'Matrix generation failed' })
  }
})

export default router
