import { Router } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = Router();
const cache  = new NodeCache({ stdTTL: 60 * 60 * 12 });   // 12-hour cache
const SERP_KEY = process.env.SERPAPI_API_KEY;

if (!SERP_KEY) console.warn('⚠️  SERPAPI_API_KEY not set — /api/services/suggest will rely on fallback');

/**
 * GET /api/services/suggest?city=Portland&niche=Plumber
 * Returns up to 10 service phrases scraped from Google Local Services results.
 */
router.get('/suggest', async (req, res) => {
  const { city = '', niche = '' } = req.query;
  if (!city || !niche) return res.status(400).json({ error: 'city and niche required' });

  /* ---------- cache hit ---------- */
  const key = `${city}|${niche}`;
  if (cache.has(key)) return res.json({ services: cache.get(key) });

  /* ---------- call SerpAPI ---------- */
  try {
    const params = {
      api_key : SERP_KEY,
      engine  : 'google_local_services',
      q       : `${niche} services in ${city}`,
      hl      : 'en',
      num     : 10
    };

    const { data } = await axios.get('https://serpapi.com/search.json', { params });

    const raw = data?.local_services?.map(s => s.service_type) || [];
    const services = [...new Set(
      raw
        .flat()
        .filter(Boolean)
        .map(v => v.replace(/services?/i, '').trim())
    )].slice(0, 10);                       // dedupe & limit

    cache.set(key, services);
    return res.json({ services });
  } catch (err) {
    /* ---------- quota or other error ---------- */
    if (err.response?.status === 429) {
      console.warn('SerpAPI quota exceeded – returning generic fallback list.');
      const fallback = [
        `${niche} service`, 'Consultation', 'Inspection', 'Maintenance'
      ].slice(0, 6);
      return res.json({ services: fallback });
    }
    console.error('SerpAPI suggest error:', err.message);
    return res.status(500).json({ error: 'Suggest failed; enter services manually.' });
  }
});

export default router;
