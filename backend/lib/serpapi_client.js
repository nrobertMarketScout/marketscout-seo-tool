// backend/lib/serpapi_client.js
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CACHE_PATH = path.join(process.cwd(), 'cache', 'serp_results_cache.json');
const MISSES_PATH = path.join(process.cwd(), 'cache', 'serp_failures.json');

const cache = {};
const misses = new Set();
let isCacheDirty = false;
let isMissesDirty = false;
let serpApiQuotaExceeded = false;

// Load caches
try {
  const raw = await fs.readFile(CACHE_PATH, 'utf-8');
  Object.assign(cache, JSON.parse(raw));
  console.log('✅ Loaded SerpAPI cache');
} catch {}

try {
  const raw = await fs.readFile(MISSES_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  parsed.forEach((k) => misses.add(k));
  console.log('✅ Loaded SerpAPI miss cache');
} catch {}

process.on('exit', async () => {
  if (isCacheDirty) {
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log('💾 Saved cache');
  }
  if (isMissesDirty) {
    await fs.writeFile(MISSES_PATH, JSON.stringify([...misses], null, 2));
    console.log('💾 Saved failures');
  }
});

export async function fetchMapsResults(keyword, location) {
  const query = `${keyword} in ${location}`;
  const cacheKey = `${keyword}::${location}`;

  if (cache[cacheKey]) return cache[cacheKey];
  if (misses.has(cacheKey)) {
    console.log(`⚠️ Skipping previously failed: ${cacheKey}`);
    return [];
  }
  if (serpApiQuotaExceeded) {
    console.warn(`⛔️ Skipping due to known quota exceeded: ${query}`);
    return [];
  }

  const url = `https://serpapi.com/search.json?engine=google_maps&type=search&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;

  try {
    const response = await axios.get(url);
    const rawResults = response.data?.local_results || [];
    const enriched = [];

    for (const result of rawResults) {
      const details = {
        name: result.title || '',
        address: result.address || '',
        phone_number: result.phone || '',
        rating: result.rating || '',
        reviews_count: result.reviews || '',
        website: result.website || ''
      };

      enriched.push({
        ...result,
        ...details,
        gps_coordinates: result.gps_coordinates
      });
    }

    cache[cacheKey] = enriched;
    isCacheDirty = true;
    return enriched;
  } catch (err) {
    if (err.response?.status === 429) {
      console.error(`⛔️ SerpAPI quota hit for "${query}"`);
      serpApiQuotaExceeded = true;
    } else {
      console.error('❌ SerpAPI fetch failed:', err.message);
    }
    misses.add(cacheKey);
    isMissesDirty = true;
    return [];
  }
}
