// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import { cosineSimilarity } from './utils/math.js';
import { encoding_for_model } from 'tiktoken';


const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------
// STATIC PREVIEW FOR GENERATED SITES (Site Builder)
app.use('/sites', express.static(path.join(process.cwd(), 'sites')));
// ------------------------------------------------------------

// ---------------- existing feature routes -------------------
import runRoute     from './api/run.js';
app.use('/api/run', runRoute);

import resultsRoute from './api/results.js';
app.use('/api/results', resultsRoute);

import summaryRoute from './api/summary.js';
app.use('/api/summary', summaryRoute);

import matrixRoute  from './api/matrix.js';
app.use('/api/matrix', matrixRoute);

import heatmapRoute from './api/heatmap.js';
app.use('/api/heatmap', heatmapRoute);

import botRoute     from './api/bot.js';
app.use('/api/bot', botRoute);

import metaRoute from './routes/meta.js';
app.use('/api/meta', metaRoute);


import ingestRoute  from './api/ingest.js'; // ✅ NEWER INGEST FEATURE
app.use('/api/ingest', ingestRoute);        // (already in your code)

// ---------------- new Site Builder route --------------------
import siteRoute    from './routes/site.js';        // ✅ NEW
app.use('/api/site', siteRoute);                    // ✅ NEW
// ------------------------------------------------------------

import cloudUpload from './routes/uploads/cloudinary.js';
app.use('/api/uploads', cloudUpload);


// ---------------- vector / /ask endpoint --------------------
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const encoder = encoding_for_model('gpt-4');

const CHUNK_PATH  = path.join(process.cwd(), 'data', 'chunks.json');
const EMB_PATH    = path.join(process.cwd(), 'data', 'embeddings.json');
const LOG_PATH    = path.join(process.cwd(), 'data', 'rank_and_rent_bot_log.json');

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const chunks      = JSON.parse(fs.readFileSync(CHUNK_PATH, 'utf-8'));
    const embeddings  = JSON.parse(fs.readFileSync(EMB_PATH,   'utf-8'));

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: question
    });
    const questionEmbedding = embeddingResponse.data[0].embedding;

    const similarities = embeddings.map((emb, i) => ({
      score : cosineSimilarity(questionEmbedding, emb),
      chunk : chunks[i]
    }));

    const top = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ chunk }) => `- ${chunk.text}`);

    const context = top.join('\n\n');
    const prompt  = `Use the context below to answer the question. If it isn't relevant, say so.\n\nContext:\n${context}\n\nQuestion:\n${question}`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful SEO and rank & rent business expert.' },
        { role: 'user',   content: prompt }
      ]
    });

    const answer = chat.choices[0].message.content.trim();

    // Save memory log
    const log = fs.existsSync(LOG_PATH)
      ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'))
      : [];

    log.push({ timestamp: new Date().toISOString(), question, response: answer });
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));

    res.json({ answer });
  } catch (err) {
    console.error('❌ /ask failed:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});
// ------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
