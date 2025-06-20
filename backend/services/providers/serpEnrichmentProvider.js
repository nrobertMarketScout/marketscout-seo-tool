// backend/services/providers/serpEnrichmentProvider.js
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const BASE = 'https://api.dataforseo.com/v3/serp/google/local_finder';
const auth = { username: process.env.DATAFORSEO_LOGIN, password: process.env.DATAFORSEO_PASSWORD };
const WAIT = (ms) => new Promise(res => setTimeout(res, ms));
const CACHE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.cache/serp');
await fs.mkdir(CACHE_DIR, { recursive: true });

function cachePath(keyword, location) {
  const k = keyword.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return path.join(CACHE_DIR, `${k}__${location}.json`);
}

export async function getSERPEnrichment(keyword, locationCode) {
  const file = cachePath(keyword, locationCode);
  try {
    const txt = await fs.readFile(file, 'utf-8');
    const { timestamp, data } = JSON.parse(txt);
    if (Date.now() - timestamp < 24*60*60*1000) {
      console.log(`🧊 [Maps] ✅ "${keyword}" in ${locationCode}`);
      return data;
    }
  } catch {}

  const payload = [{ keyword, location_code: Number(locationCode), language_code: 'en', depth: 20 }];
  const post = await axios.post(`${BASE}/task_post`, payload, { auth });
  const id = post.data.tasks?.[0]?.id;
  if (!id) throw new Error('🛑 No task id');

  console.log(`📡 [Maps] Posted SERP task for "${keyword}", ID: ${id}`);

  let result;
  for (let i = 1; i <= 8; i++) {
    await WAIT(2000);
    const resp = await axios.get(`${BASE}/task_get/advanced/${id}`, { auth });
    const task = resp.data.tasks?.[0];
    if (task?.status_code === 20000 && task.result_count > 0 && task.result?.length) {
      result = task.result;
      break;
    }
    console.log(`⚠️ [Maps] Empty result on attempt ${i}: ${JSON.stringify(task || resp.data)}`);
  }

  if (!result) {
    console.warn(`❌ No SERP results found for "${keyword}"`);
    return null;
  }

  const out = {
    hasMapPack: true,
    mapPackOverlap: result.length,
    mapPackWeak: result.filter(r => !r.is_promoted).length
  };
  await fs.writeFile(file, JSON.stringify({ timestamp: Date.now(), data: out }));
  console.log(`💾 [Maps] Cached SERP for "${keyword}"`);
  return out;
}
