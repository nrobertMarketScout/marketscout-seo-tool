// backend/routes/locations.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const router = express.Router();
const cityCSVPath = path.join(process.cwd(), 'US_City_Population_Data__Cleaned_.csv');

function normalizeCity(cityRaw, stateRaw) {
  let city = cityRaw.trim();
  let st = stateRaw.trim().toUpperCase();

  // Handle "City (ST)" format
  const match = city.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (match) {
    city = match[1].trim();
    st = match[2].trim().toUpperCase();
  }

  return `${city}, ${st}`;
}

async function loadCitiesFromCSV() {
  const raw = await fs.readFile(cityCSVPath);
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  const citySet = new Set();
  for (const row of records) {
    const city = row['City/Town/CDP']?.trim();
    const state = row['State']?.trim() || row['ST']?.trim();
    if (!city || !state) continue;
    citySet.add(normalizeCity(city, state));
  }

  return [...citySet].sort((a, b) => a.localeCompare(b));
}

router.get('/', async (req, res) => {
  try {
    const allCities = await loadCitiesFromCSV();

    const q = req.query.q?.toLowerCase();
    const filtered = q
      ? allCities.filter(c => c.toLowerCase().includes(q))
      : allCities;

    res.json(filtered.slice(0, 100));
  } catch (err) {
    console.error('❌ Failed to load cities:', err.message);
    res.status(500).json({ error: 'Could not load city list' });
  }
});

export default router;
