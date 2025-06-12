import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

const router   = Router();
const rootDir  = process.cwd();                    // …/marketscout-seo-tool/backend
const cityCSV  = path.join(rootDir, 'US_City_Population_Data__Cleaned_.csv');
const nicheCSV = path.join(rootDir, 'services_list.csv');

/* ---------- helpers ---------- */
function normaliseCity(cityRaw, stateRaw) {
  let city = cityRaw.trim();
  let st   = stateRaw.trim().toUpperCase();

  // if city has "(ST)" suffix, prefer that
  const m = city.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (m) {
    city = m[1].trim();
    st   = m[2].trim().toUpperCase();
  }
  return `${city}, ${st}`;
}

async function loadCities() {
  const csv     = await fs.readFile(cityCSV);
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  const set = new Set();
  for (const r of records) {
    const cityRaw  = r['City/Town/CDP'] || '';
    const stateRaw = r['State'] || r['ST'] || '';
    if (!cityRaw || !stateRaw) continue;
    set.add(normaliseCity(cityRaw, stateRaw));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

async function loadNiches() {
  const csv     = await fs.readFile(nicheCSV);
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  return [...new Set(records.map(r => r['Service'].trim()).filter(Boolean))].sort();
}

/* ---------- cache ---------- */
let cachedCities = null;
let cachedNiches = null;

/* ---------- endpoints ---------- */
router.get('/cities', async (_req, res) => {
  try {
    if (!cachedCities) cachedCities = await loadCities();
    res.json({ cities: cachedCities });
  } catch (err) {
    console.error('City list error:', err.message);
    res.status(500).json({ error: 'Could not load city list' });
  }
});

router.get('/niches', async (_req, res) => {
  try {
    if (!cachedNiches) cachedNiches = await loadNiches();
    res.json({ niches: cachedNiches });
  } catch (err) {
    console.error('Niche list error:', err.message);
    res.status(500).json({ error: 'Could not load niche list' });
  }
});

export default router;
