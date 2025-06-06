import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';
import { fetchMapsResults } from '../lib/serpapi_client.js';
import { auditAndScore } from '../lib/audit_and_score.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const file = await fs.readFile(filePath, 'utf8');
    const { data: rows } = Papa.parse(file, { header: true });

    const groups = {};
    for (const row of rows) {
      const groupKey = row.Group?.trim() || `${row.Keyword}_${row.Location}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { location: row.Location, keywords: [] };
      }
      groups[groupKey].keywords.push(row.Keyword);
    }

    const allResults = [];

    for (const [groupName, { location, keywords }] of Object.entries(groups)) {
      const groupResults = {};

      for (const keyword of keywords) {
        const results = await fetchMapsResults(keyword, location);

        for (const res of results) {
          if (res.place_id && !groupResults[res.place_id]) {
            groupResults[res.place_id] = {
              Group: groupName,
              Keyword: keyword,
              Location: location,
              Name: res.title || res.name,
              Rating: res.rating,
              Reviews: res.rating_total || res.reviews_count,
              Address: res.address,
              Phone: res.phone_number,
              PlaceId: res.place_id,
              Website: res.website || '',
            };
          }
        }
      }

      allResults.push(...Object.values(groupResults));
    }

    await fs.writeFile('results.csv', Papa.unparse(allResults, { quotes: true }));

    const summaryData = auditAndScore(allResults);
    await fs.writeFile('competitor_audit_summary.csv', Papa.unparse(summaryData, { quotes: true }));
    await fs.writeFile('combined_opportunity_matrix.csv', Papa.unparse(allResults, { quotes: true }));

    res.json({ summary: summaryData });
  } catch (err) {
    console.error('❌ /api/run error:', err);
    res.status(500).json({ error: 'Scrape and audit failed.' });
  }
});

export default router;
