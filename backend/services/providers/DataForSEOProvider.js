// backend/services/providers/DataForSEOProvider.js
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
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
const memoryCache = new Map();
const diskCacheDir = path.resolve(__dirname, '../../../.cache/seo');

// Ensure disk cache directory exists
await fs.mkdir(diskCacheDir, { recursive: true });

function getCacheFilename(keyword, location) {
  const safeKey = `${keyword.toLowerCase().replace(/[^a-z0-9]/gi, '_')}__${location}`;
  return path.join(diskCacheDir, `${safeKey}.json`);
}

async function readDiskCache(keyword, location) {
  const filename = getCacheFilename(keyword, location);
  try {
    const content = await fs.readFile(filename, 'utf-8');
    const parsed = JSON.parse(content);
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      console.log(`[DiskCache] ✅ Using disk cache for "${keyword}" in ${location}`);
      return parsed.data;
    }
  } catch { /* ignore */ }
  return null;
}

async function writeDiskCache(keyword, location, data) {
  const filename = getCacheFilename(keyword, location);
  const payload = {
    timestamp: Date.now(),
    data
  };
  await fs.writeFile(filename, JSON.stringify(payload), 'utf-8');
}

export async function getKeywordMetrics(keywords, location) {
  if (!Array.isArray(keywords)) throw new Error('keywords must be an array');

  const now = Date.now();
  const results = [];
  const keywordsToFetch = [];

  for (const keyword of keywords) {
    const cacheKey = `${keyword.toLowerCase()}::${location}`;

    if (memoryCache.has(cacheKey)) {
      const { data, timestamp } = memoryCache.get(cacheKey);
      if (now - timestamp < CACHE_TTL) {
        console.log(`[Cache] ✅ Using in-memory cache for "${keyword}"`);
        results.push({ keyword, ...data });
        continue;
      }
    }

    const diskHit = await readDiskCache(keyword, location);
    if (diskHit) {
      results.push({ keyword, ...diskHit });
      memoryCache.set(cacheKey, { data: diskHit, timestamp: now });
      continue;
    }

    keywordsToFetch.push(keyword);
  }

  if (!keywordsToFetch.length) return results;

  const payload = [{
    keywords: keywordsToFetch,
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
        taskResults = result.data.tasks?.[0]?.result || [];
        if (taskResults.length) break;
      } catch (err) {
        console.warn(`⚠️ Poll attempt ${attempt} failed: ${err.message}`);
      }
    }

    if (!taskResults.length) throw new Error(`❌ No keyword data found after ${MAX_POLL_ATTEMPTS} tries.`);

    for (const keyword of keywordsToFetch) {
      const cacheKey = `${keyword.toLowerCase()}::${location}`;
      const match = taskResults.find(e => e.keyword.toLowerCase() === keyword.toLowerCase());

      if (match) {
        const data = {
          volume: match.search_volume || 0,
          cpc: match.cpc || 0,
          competition: match.competition || 0,
          trend: (match.monthly_searches || []).map(m => ({
            year: m.year,
            month: m.month,
            volume: m.search_volume
          })),
          mapPackOverlap: match.mapPackOverlap ?? 0,
          mapPackWeak: match.mapPackWeak ?? 0
        };

        results.push({ keyword, ...data });
        memoryCache.set(cacheKey, { data, timestamp: now });
        await writeDiskCache(keyword, location, data);

        console.log(`[DataForSEO] ✅ ${keyword} in ${location}: Vol=${data.volume}, CPC=${data.cpc}`);
      } else {
        console.warn(`[DataForSEO] ❌ No result for ${keyword} in ${location}`);
        const fallback = {
          volume: 0,
          cpc: 0,
          competition: 0,
          trend: [],
          mapPackOverlap: 0,
          mapPackWeak: 0
        };
        results.push({ keyword, ...fallback });
        memoryCache.set(cacheKey, { data: fallback, timestamp: now });
        await writeDiskCache(keyword, location, fallback);
      }
    }

    return results;
  } catch (err) {
    console.error(`❌ Batch fetch failed: ${err.message}`);
    return keywords.map(k => ({
      keyword: k,
      volume: 0,
      cpc: 0,
      competition: 0,
      trend: [],
      mapPackOverlap: 0,
      mapPackWeak: 0
    }));
  }
}
