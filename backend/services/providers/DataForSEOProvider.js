// backend/services/providers/DataForSEOProvider.js
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });


const API_BASE = 'https://api.dataforseo.com/v3';
const SLEEP = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_POLL_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2500;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const user = process.env.DATAFORSEO_LOGIN;
const pass = process.env.DATAFORSEO_PASSWORD;

if (!user || !pass) {
  throw new Error('❌ Missing DataForSEO credentials in environment.');
}

const auth = { username: user, password: pass };

// In-memory cache (per keyword::location)
const cache = new Map();

export async function getKeywordMetrics(keywords, location) {
  if (!Array.isArray(keywords)) {
    throw new Error('keywords must be an array');
  }

  const now = Date.now();
  const results = [];

  const payload = [{
    keywords,
    location_code: Number(location),
    language_name: 'English'
  }];

  try {
    const postRes = await axios.post(
      `${API_BASE}/keywords_data/google_ads/search_volume/task_post`,
      payload,
      { auth }
    );

    const taskId = postRes.data.tasks?.[0]?.id;
    if (!taskId) throw new Error('❌ No task ID returned');

    const getPath = `${API_BASE}/keywords_data/google_ads/search_volume/task_get/${taskId}`;
    let taskResults = [];

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      await SLEEP(POLL_INTERVAL_MS);
      try {
        const result = await axios.get(getPath, { auth });
    
        // 👇 Add this log:
        console.log(`[DEBUG] Poll response attempt ${attempt}:`, JSON.stringify(result.data, null, 2));
    
        taskResults = result.data.tasks?.[0]?.result || [];
    
        if (taskResults.length) break;
      } catch (err) {
        console.warn(`[${new Date().toISOString()}] ⚠️ Poll attempt ${attempt} failed: ${err.message}`);
      }
    }
    

    if (!taskResults.length) {
      throw new Error(`❌ No keyword data found after ${MAX_POLL_ATTEMPTS} tries.`);
    }

    for (const keyword of keywords) {
      const cacheKey = `${keyword.toLowerCase()}::${location}`;

      // Check cache
      if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey);
        if (now - timestamp < CACHE_TTL) {
          console.log(`[Cache] ✅ Using cached data for "${keyword}" in ${location}`);
          results.push({ keyword, ...data });
          continue;
        } else {
          cache.delete(cacheKey);
        }
      }

      const match = taskResults.find(
        (entry) => entry.keyword.toLowerCase() === keyword.toLowerCase()
      );

      if (match) {
        const data = {
          volume: match.search_volume || 0,
          cpc: match.cpc || 0,
          competition: match.competition || 0,
          trend: (match.monthly_searches || []).map(item => ({
            year: item.year,
            month: item.month,
            volume: item.search_volume
          }))
        };

        results.push({ keyword, ...data });
        cache.set(cacheKey, { data, timestamp: now });

        console.log(`[DataForSEO] ✅ ${keyword} in ${location}: Vol=${data.volume}, CPC=${data.cpc}`);
      } else {
        console.warn(`[DataForSEO] ❌ No result for ${keyword} in ${location}`);
        results.push({ keyword, volume: 0, cpc: 0, competition: 0, trend: [] });
      }
    }

    return results;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Batch fetch failed: ${err.message}`);
    return keywords.map(k => ({ keyword: k, volume: 0, cpc: 0, competition: 0, trend: [] }));
  }
}
