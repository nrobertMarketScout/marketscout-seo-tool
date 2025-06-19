// backend/api/matrix.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { getKeywordStats } from '../providers/keywordStatsProvider.js'
import { scoreKeyword } from '../utils/scoring.js'
import { getLocationCodeByName } from '../utils/locationCodes.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const matrixInputPath = path.resolve(__dirname, '../data/input.csv')

const metricsCache = new Map()

router.get('/', async (req, res) => {
  try {
    const csv = await fs.readFile(matrixInputPath, 'utf-8')
    const { data: rows } = Papa.parse(csv, { header: true })

    const enriched = await Promise.all(
      rows.map(async row => {
        const keyword = row.Keyword?.trim()
        const location = row.Location?.trim()

        if (!keyword || !location) {
          console.warn('❌ Skipping invalid row in CSV:', row)
          return null
        }

        const locationCode = getLocationCodeByName(location)
        if (!locationCode) {
          console.warn(`❌ Skipping row — location code not found for "${location}"`)
          return null
        }

        const cacheKey = `${keyword.toLowerCase()}::${locationCode}`
        const now = Date.now()
        const ttl = 24 * 60 * 60 * 1000

        console.log(`🔑 Checking cache key: ${cacheKey}`)

        let metrics

        if (metricsCache.has(cacheKey)) {
          const { data, timestamp } = metricsCache.get(cacheKey)
          if (now - timestamp < ttl) {
            console.log(`✅ Using cached metrics for ${cacheKey}`)
            metrics = data
          } else {
            metricsCache.delete(cacheKey)
          }
        }

        if (!metrics) {
          const [result] = await getKeywordStats([keyword], locationCode)
          metrics = result
          metricsCache.set(cacheKey, { data: result, timestamp: now })
        }

        const { score, breakdown } = scoreKeyword({
          keyword,
          location,
          search_volume: metrics.volume,
          cpc: metrics.cpc,
          competition: metrics.competition,
          hasMapPack: metrics.hasMapPack ?? false,
          overlappingResults: metrics.overlappingResults ?? 0,
          adCount: metrics.adCount ?? 0
        })

        return {
          keyword,
          location,
          volume: metrics.volume,
          cpc: metrics.cpc,
          competition: metrics.competition,
          hasMapPack: metrics.hasMapPack ?? false,
          score,
          score_breakdown: breakdown
        }
      })
    )

    const clean = enriched.filter(Boolean)

    console.log('✅ Final Enriched Matrix:', clean.slice(0, 3))
    console.log('🧠 Active cache keys this run:', Array.from(metricsCache.keys()))

    res.json({ matrix: clean })
  } catch (err) {
    console.error('❌ Failed to generate matrix:', err)
    res.status(500).json({ error: 'Matrix generation failed' })
  }
})

export default router
