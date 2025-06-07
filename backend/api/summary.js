import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const summaryPath = path.resolve('backend/competitor_audit_summary.csv');
    const csv = await fs.readFile(summaryPath, 'utf-8');
    const { data } = Papa.parse(csv, { header: true });
    res.json({ summary: data });
  } catch (err) {
    console.error('❌ Failed to load summary.csv:', err);
    res.status(403).json({ error: 'Could not load summary file.' });
  }
});

export default router;
