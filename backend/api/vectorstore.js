// backend/api/vectorstore.js
import express from 'express';
import { buildVectorstore } from '../vectorstore/load_vectorstore.js';

const router = express.Router();

router.post('/rebuild', async (req, res) => {
  try {
    await buildVectorstore();
    res.json({ message: '✅ Vectorstore rebuilt successfully.' });
  } catch (err) {
    console.error('❌ Vectorstore rebuild failed:', err);
    res.status(500).json({ error: 'Vectorstore rebuild failed.' });
  }
});

export default router;
