// backend/api/results.js
import express from 'express';
import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const csvPath = path.resolve('results.csv');
    const file = await fs.readFile(csvPath, 'utf8');
    const { data } = Papa.parse(file, { header: true });
    res.json({ data });
  } catch (err) {
    console.error('❌ Failed to load results.csv:', err);
    res.status(500).json({ error: 'Could not load results.' });
  }
});

export default router;
