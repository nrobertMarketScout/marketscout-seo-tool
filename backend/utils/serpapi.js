// backend/utils/serpapi.js
const axios = require('axios')

async function querySerpAPI(question) {
  const params = {
    q: question,
    api_key: process.env.SERPAPI_API_KEY,
    engine: 'google',
    num: 3
  }

  try {
    const response = await axios.get('https://serpapi.com/search', { params })
    const snippets = response.data.organic_results
      ?.map(r => `• ${r.title}: ${r.snippet}`)
      .join('\n')
    return snippets || 'No useful results from Google Search.'
  } catch (err) {
    console.error('❌ SerpAPI error:', err)
    return 'SerpAPI request failed.'
  }
}

module.exports = { querySerpAPI }
