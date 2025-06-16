// ESM-compliant DataForSEOProvider.js
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'

const API_BASE = 'https://api.dataforseo.com/v3'
const SLEEP = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const MAX_POLL_ATTEMPTS = 3
const POLL_INTERVAL_MS = 2500

const user = process.env.DATAFORSEO_LOGIN
const pass = process.env.DATAFORSEO_PASSWORD

if (!user || !pass) {
  throw new Error('❌ Missing DataForSEO credentials in environment.')
}

const auth = {
  username: user,
  password: pass
}

export async function getKeywordMetrics(keyword, location) {
  const data = [{
    keyword,
    location_name: location,
    language_name: 'English'
  }]

  try {
    // Submit volume task
    const volumeRes = await axios.post(`${API_BASE}/keywords_data/google_ads/search_volume/task_post`, data, { auth })
    const taskId = volumeRes.data.tasks?.[0]?.id
    if (!taskId) throw new Error(`❌ No task ID returned for keyword "${keyword}"`)

    const getPath = `${API_BASE}/keywords_data/google_ads/search_volume/task_get/${taskId}`

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      await SLEEP(POLL_INTERVAL_MS)
      try {
        const result = await axios.get(getPath, { auth })
        const items = result.data.tasks?.[0]?.result || []
        const found = items.find(entry => entry.keyword.toLowerCase() === keyword.toLowerCase())

        if (found) {
          const volume = found.search_volume || 0
          const cpc = found.cpc?.value || 0
          const competition = found.competition || 0
          console.log(`✅ ${keyword} in ${location}: Vol=${volume}, CPC=$${cpc}, Comp=${competition}`)
          return { volume, cpc, competition }
        }
      } catch (err) {
        console.warn(`⚠️ Polling attempt ${attempt} failed: ${err.response?.statusText || err.message}`)
      }
    }

    throw new Error(`❌ No keyword volume result found after ${MAX_POLL_ATTEMPTS} tries.`)
  } catch (err) {
    console.error(`❌ DataForSEO error (${keyword}): ${err.message}`)
    return { volume: 0, cpc: 0, competition: 0 }
  }
}
