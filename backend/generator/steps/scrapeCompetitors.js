import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import tinify from 'tinify';
import NodeCache from 'node-cache';

tinify.key = process.env.TINIFY_API_KEY || '';
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });

/* Unsplash fallbacks */
const UNSPLASH = [
  'https://source.unsplash.com/900x600/?business',
  'https://source.unsplash.com/900x600/?team',
  'https://source.unsplash.com/900x600/?office'
];

async function fetchCompetitorUrls(city, niche) {
  const key = `${city}|${niche}|urls`;
  if (cache.has(key)) return cache.get(key);

  const { SERPAPI_API_KEY } = process.env;
  if (!SERPAPI_API_KEY) return [];

  try {
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: {
        api_key : SERPAPI_API_KEY,
        engine  : 'google_maps',
        q       : `${niche} near ${city}`,
        hl      : 'en'
      },
      timeout: 10000
    });
    const urls = (data.local_results || [])
      .map(r => r.website)
      .filter(Boolean)
      .slice(0, 3);

    cache.set(key, urls);
    return urls;
  } catch (err) {
    if (err.response?.status === 429) console.warn('SerpAPI quota hit – skipping competitor scrape.');
    return [];                       // graceful fallback
  }
}

function pickImage($) {
  const og = $('meta[property="og:image"]').attr('content');
  if (og) return og;
  const img = $('img').first().attr('src') || '';
  return img.startsWith('http') ? img : '';
}

export default async function scrapeCompetitors({ slug, city, niche, competitors = '' }) {
  const distImg = path.join(process.cwd(), 'uploads', slug, 'assets', 'img');
  await fs.mkdir(distImg, { recursive: true });

  /* -------- select URLs -------- */
  let urls = competitors
    .split(/\s+/)
    .filter(u => /^https?:\/\//i.test(u))
    .slice(0, 3);

  if (!urls.length) urls = await fetchCompetitorUrls(city, niche);
  if (!urls.length) urls = [];                    // no SerpAPI -> skip scrape

  const features = [];

  for (const url of urls) {
    try {
      const { data: html } = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(html);

      const imgUrl  = pickImage($);
      const snippet = ($('h1').first().text().trim() || $('p').first().text().trim()).slice(0, 140);
      if (!imgUrl || !snippet) continue;

      const imgResp = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 8000 });
      let buf = Buffer.from(imgResp.data);
      if (tinify.key) { try { buf = await tinify.fromBuffer(buf).toBuffer(); } catch {} }

      const fname = crypto.createHash('md5').update(imgUrl).digest('hex').slice(0,10)+'.jpg';
      await fs.writeFile(path.join(distImg, fname), buf);
      features.push({ img: `assets/img/${fname}`, text: snippet });
      if (features.length >= 3) break;
    } catch {/* ignore slow or broken site */}
  }

  /* -------- Unsplash fallback to fill up to 3 -------- */
  for (let i = 0; features.length < 3 && i < UNSPLASH.length; i++) {
    try {
      const src = UNSPLASH[i];
      const buf = (await axios.get(src, { responseType: 'arraybuffer', timeout: 5000 })).data;
      const fname = `unsplash-${i}.jpg`;
      await fs.writeFile(path.join(distImg, fname), Buffer.from(buf));
      features.push({ img: `assets/img/${fname}`, text: `${niche} expertise` });
    } catch {/* network hiccup – skip */}
  }

  return features;
}
