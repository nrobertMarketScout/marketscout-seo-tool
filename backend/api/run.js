import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { getKeywordMetrics } from '../services/providers/DataForSEOProvider.js';
import { normalizeLocation } from '../utils/locationValidator.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const inputPath = req.file.path;
  const results = [];
  const errors = [];

  try {
    const rows = await new Promise((resolve, reject) => {
      const parsedRows = [];
      fs.createReadStream(inputPath)
        .pipe(csvParser())
        .on('data', (row) => parsedRows.push(row))
        .on('end', () => resolve(parsedRows))
        .on('error', reject);
    });

    const cleanRows = rows
      .map(({ Keyword, Location }) => {
        const keyword = (Keyword || '').trim();
        const location = normalizeLocation(Location || '');
        return keyword && location ? { keyword, location } : null;
      })
      .filter(Boolean);

    for (const { keyword, location } of cleanRows) {
      try {
        const data = await getKeywordMetrics(keyword, location);
        results.push({ keyword, location, ...data });
      } catch (e) {
        errors.push({ keyword, location, error: e.message });
      }
    }

    const outputPath = path.join('results.csv');
    const header = Object.keys(results[0] || { keyword: '', location: '', cpc: '', volume: '', competition: '' }).join(',');
    const csvData = results.map(r => Object.values(r).join(',')).join('\n');

    fs.writeFileSync(outputPath, `${header}\n${csvData}`);
    res.json({ success: true, results, errors });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: 'Failed to process scrape input.' });
  } finally {
    fs.unlinkSync(inputPath);
  }
});

export default router;
