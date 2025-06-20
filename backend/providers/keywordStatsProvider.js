// backend/providers/keywordStatsProvider.js
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getKeywordMetrics } from '../services/providers/DataForSEOProvider.js';

const CACHE_DIR = path.resolve('./cache/keywords');
await fs.mkdir(CACHE_DIR, { recursive: true });

function getCacheKey(keyword, location) {
  return crypto.createHash('md5').update(`${keyword.toLowerCase()}::${location}`).digest('hex');
}

async function readCache(key) {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeCache(key, payload) {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
}

export async function getKeywordStats(keywords, locationCode) {
  const results = [];
  const fresh = [];
  const now = Date.now();
  const TTL = 24 * 60 * 60 * 1000;

  for (const keyword of keywords) {
    const key = getCacheKey(keyword, locationCode);
    const cached = await readCache(key);

    if (cached && now - cached.timestamp < TTL) {
      console.log(`🧊 [DiskCache] ✅ "${keyword}" in ${locationCode}`);
      results.push({ keyword, ...cached.data });
    } else {
      fresh.push({ keyword, key });
    }
  }

  if (fresh.length > 0) {
    const freshKeywords = fresh.map(f => f.keyword);
    let freshResults = [];

    try {
      freshResults = await getKeywordMetrics(freshKeywords, locationCode);
    } catch (err) {
      console.error('❌ getKeywordMetrics failed:', err.message);
    }

    for (let i = 0; i < freshResults.length; i++) {
      const { keyword, ...data } = freshResults[i];
      const key = getCacheKey(keyword, locationCode);
      results.push({ keyword, ...data });
      await writeCache(key, { data, timestamp: now });
      console.log(`💾 [DiskCache] Saved "${keyword}" to disk`);
    }
  }

  return results;
}
