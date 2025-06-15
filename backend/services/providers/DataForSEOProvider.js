// backend/services/providers/DataForSEOProvider.js
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const API_BASE = 'https://api.dataforseo.com/v3'

const username = process.env.DATAFORSEO_LOGIN
const password = process.env.DATAFORSEO_PASSWORD

const AUTH_HEADER = {
  headers: {
    Authorization:
      'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    'Content-Type': 'application/json'
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function postKeywordTask(keyword) {
  const payload = [
    {
      keywords: [keyword], // ✅ FIXED KEY
      location_code: 2840,
      language_code: 'en'
    }
  ]

  console.log('📤 Sending keyword task payload to DataForSEO:', JSON.stringify(payload, null, 2))

  try {
    const response = await axios.post(
      `${API_BASE}/keywords_data/google_ads/search_volume/task_post`,
      payload,
      AUTH_HEADER
    )

    const task = response.data?.tasks?.[0]
    console.log('✅ Task POST response:', JSON.stringify(task, null, 2))

    return task?.id
  } catch (err) {
    console.error('❌ Error submitting keyword to DataForSEO:', err.response?.data || err.message)
    throw err
  }
}

async function getTaskResult(taskId, endpoint) {
  const maxAttempts = 15
  const delay = 2000

  console.log(`⏳ Waiting 3s before polling task ${taskId}...`)
  await sleep(3000) // ✅ added delay before polling

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(delay)

    try {
      const url = `${API_BASE}/${endpoint}/task_get/${taskId}`
      console.log(`🔁 Attempt ${i + 1} - GET ${url}`)

      const res = await axios.get(url, AUTH_HEADER)

      const task = res.data.tasks?.[0]
      if (task?.result?.[0]) {
        console.log(`✅ Result ready for ${taskId}`)
        return task.result[0]
      }
    } catch (err) {
      console.error(`❌ Poll attempt ${i + 1} failed:`, err.response?.data || err.message)
    }
  }

  throw new Error('DataForSEO task did not complete in time')
}

export class DataForSEOProvider {
  static async getKeywordMetrics(keywords = []) {
    const results = []

    for (const keyword of keywords) {
      try {
        const taskId = await postKeywordTask(keyword)
        const result = await getTaskResult(taskId, 'keywords_data/google_ads/search_volume')

        results.push({
          keyword,
          search_volume: result.search_volume || 0,
          cpc: result.cpc?.value || 0,
          competition: result.competition || 0
        })
      } catch (err) {
        console.error(`❌ Failed to fetch result for ${keyword}:`, err.message)
        results.push({
          keyword,
          search_volume: 'N/A',
          cpc: 'N/A',
          competition: 'N/A'
        })
      }
    }

    return results
  }

  static async getSERPInsights(keyword, locationCode = 2840) {
    try {
      const response = await axios.post(
        `${API_BASE}/serp/google/organic/task_post`,
        [{ keyword, location_code: locationCode, language_code: 'en' }],
        AUTH_HEADER
      )

      const taskId = response.data.tasks?.[0]?.id
      const result = await getTaskResult(taskId, 'serp/google/organic')

      const firstPage = result?.items || []

      const hasLocalPack = firstPage.some((item) => item.type === 'local_pack')
      const organicResults = firstPage.filter((item) => item.type === 'organic')

      return {
        hasLocalPack,
        organicResults: organicResults.map((res) => ({
          title: res.title,
          url: res.url,
          domain: res.domain
        }))
      }
    } catch (err) {
      console.error('❌ SERP Insights error:', err.response?.data || err.message)
      return { hasLocalPack: false, organicResults: [] }
    }
  }
}
