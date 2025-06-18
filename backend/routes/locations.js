// backend/routes/locations.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import stringSimilarity from 'string-similarity';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LOCATION_FILE = path.resolve(__dirname, '../data/locations-dataforseo.json');

let locationsCache = null;

// Load + cache locations at startup
const loadLocations = async () => {
  if (!locationsCache) {
    const raw = await fs.readFile(LOCATION_FILE, 'utf-8');
    locationsCache = JSON.parse(raw);
  }
  return locationsCache;
};

// GET /api/locations/code?name=Portland, OR
router.get('/code', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Missing location name' });
  }

  try {
    const locations = await loadLocations();

    const bestMatch = stringSimilarity.findBestMatch(
      name.toLowerCase(),
      locations.map(l => l.location_name.toLowerCase())
    );

    const matchIndex = bestMatch.bestMatchIndex;
    const result = locations[matchIndex];

    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }

    return res.json({
      location_name: result.location_name,
      location_code: result.location_code
    });
  } catch (err) {
    console.error('❌ Location code lookup failed:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
