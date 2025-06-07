import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve parsed summary data
router.get('/', async (req, res) => {
  try {
    const summaryPath = path.resolve(__dirname, '../combined_opportunity_matrix.csv');
    const csv = await fs.readFile(summaryPath, 'utf-8');
    const { data } = Papa.parse(csv, { header: true });
    res.json({ summary: data });
  } catch (err) {
    console.error('❌ Failed to load summary.csv:', err);
    res.status(403).json({ error: 'Could not load summary file.' });
  }
});

// Serve static CSV files for download
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const allowed = ['results.csv', 'competitor_audit_summary.csv', 'combined_opportunity_matrix.csv'];
  if (!allowed.includes(filename)) {
    return res.status(403).json({ error: 'Unauthorized file' });
  }

  const filePath = path.resolve(__dirname, `../${filename}`);
  res.download(filePath, filename, err => {
    if (err) {
      console.error('❌ Download error:', err);
      res.status(500).json({ error: 'File not found or inaccessible' });
    }
  });
});


export default router;
