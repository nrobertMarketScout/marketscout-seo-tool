// backend/api/vectorstore/test.js
import express from 'express';
// ✅ correct relative path
import { loadRetriever } from '../vectorstore/retriever.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing ?q= parameter' });

  try {
    const retriever = await loadRetriever();
    const results = await retriever.getRelevantDocuments(query);

    const formatted = results.map(doc => ({
      metadata: doc.metadata,
      text: doc.pageContent.slice(0, 300) + (doc.pageContent.length > 300 ? '...' : '')
    }));

    res.json({ query, results: formatted });
  } catch (err) {
    console.error('❌ Vectorstore test error:', err);
    res.status(500).json({ error: 'Failed to run vectorstore test' });
  }
});

export default router;
