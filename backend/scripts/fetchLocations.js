// backend/scripts/fetchLocations.js
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const user = process.env.DATAFORSEO_LOGIN;
const pass = process.env.DATAFORSEO_PASSWORD;

const URL = 'https://api.dataforseo.com/v3/serp/google/locations';
const OUT_PATH = path.resolve('backend/data/locations-dataforseo.json');

const auth = { username: user, password: pass };

(async () => {
  try {
    console.log('🌍 Fetching DataForSEO US locations...');

    const response = await axios.get(URL, { auth });

    const all = response.data.tasks[0].result;
    const usOnly = all.filter(loc => loc.country_iso_code === 'US');

    const simplified = usOnly.map(loc => ({
      location_code: loc.location_code,
      location_name: loc.location_name,
      country_iso_code: loc.country_iso_code
    }));

    await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
    await fs.writeFile(OUT_PATH, JSON.stringify(simplified, null, 2));

    console.log(`✅ Saved ${simplified.length} US locations to ${OUT_PATH}`);
  } catch (err) {
    console.error('❌ Failed to fetch locations:', err.response?.data || err.message);
  }
})();
