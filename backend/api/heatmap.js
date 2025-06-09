// backend/api/heatmap.js
import express from 'express';
import fs from 'fs';
import csvParser from 'csv-parser';
import path from 'path';

const router = express.Router();
const CSV_PATH = path.join(process.cwd(), 'combined_opportunity_matrix.csv');

router.get('/', async (req, res) => {
  const results = [];

  try {
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on('data', (row) => {
        console.log('🧪 Headers in row:', Object.keys(row));

        const lat = parseFloat(row.Latitude?.trim());
        const lng = parseFloat(row.Longitude?.trim());
        const score = parseFloat(row['Opportunity Score']?.trim());

        console.log(`🧪 Row → lat: ${row.Latitude}, lng: ${row.Longitude}, score: ${row['Opportunity Score']}`);

        if (!isNaN(lat) && !isNaN(lng)) {
          results.push({
            latitude: lat,
            longitude: lng,
            score: isNaN(score) ? 0 : score,
            keyword: row.Keyword,
            location: row.Location,
            name: row.Name,
            phone: row.Phone,
            address: row.Address,
            website: row.Website,
            rating: row.Rating,
            reviews: row.Reviews
          });
        }
      })
      .on('end', () => {
        res.json(results);
      })
      .on('error', (err) => {
        console.error('❌ Error reading CSV:', err);
        res.status(500).json({ error: 'Failed to parse heatmap data.' });
      });
  } catch (err) {
    console.error('❌ /api/heatmap failed:', err);
    res.status(500).json({ error: 'Unexpected failure.' });
  }
});

export default router;
