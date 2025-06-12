// backend/server.js
import dotenv from 'dotenv';
dotenv.config();

import express  from 'express';
import cors     from 'cors';
import fs       from 'fs';
import path     from 'path';
import { OpenAI } from 'openai';
import { encoding_for_model } from 'tiktoken';
import { cosineSimilarity }  from './utils/math.js';

/* ----------------─ Express app ─---------------- */
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* -------- static previews & downloads -------- */
app.use('/sites',    express.static(path.join(process.cwd(), 'sites')));
app.use('/uploads',  express.static(path.join(process.cwd(), 'uploads')));

/* ----- view-source helper  (regex avoids *) ---- */
app.get(/^\/uploads\/(.+\.(?:html|htm))$/, (req, res, next) => {
  if (req.query.view === 'source') {
    const rel = req.params[0];                           // regex capture
    const abs = path.join(process.cwd(), 'uploads', rel);
    return res.sendFile(abs);
  }
  next();
});

/* ---------------- feature routes -------------- */
import runRoute     from './api/run.js';
import resultsRoute from './api/results.js';
import summaryRoute from './api/summary.js';
import matrixRoute  from './api/matrix.js';
import heatmapRoute from './api/heatmap.js';
import botRoute     from './api/bot.js';
import ingestRoute  from './api/ingest.js';
import metaRoute    from './routes/meta.js';
import siteRoute    from './routes/site.js';
import uploadRoute  from './routes/uploads/cloudinary.js';
import serviceRoute from './routes/services.js';

app.use('/api/run',      runRoute);
app.use('/api/results',  resultsRoute);
app.use('/api/summary',  summaryRoute);
app.use('/api/matrix',   matrixRoute);
app.use('/api/heatmap',  heatmapRoute);
app.use('/api/bot',      botRoute);
app.use('/api/ingest',   ingestRoute);
app.use('/api/meta',     metaRoute);
app.use('/api/site',     siteRoute);
app.use('/api/uploads',  uploadRoute);
app.use('/api/services', serviceRoute);

/* --------------- /ask vector search ----------- */
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const encoder = encoding_for_model('gpt-4');

const DATA_DIR   = path.join(process.cwd(), 'data');
const CHUNK_PATH = path.join(DATA_DIR, 'chunks.json');
const EMB_PATH   = path.join(DATA_DIR, 'embeddings.json');
const LOG_PATH   = path.join(DATA_DIR, 'rank_and_rent_bot_log.json');

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const chunks     = JSON.parse(fs.readFileSync(CHUNK_PATH, 'utf8'));
    const embeddings = JSON.parse(fs.readFileSync(EMB_PATH,   'utf8'));

    const embedResp  = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: question
    });
    const qVec = embedResp.data[0].embedding;

    const top = embeddings
      .map((v, i) => ({ score: cosineSimilarity(qVec, v), chunk: chunks[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(o => `- ${o.chunk.text}`)
      .join('\n\n');

    const prompt = `Use the context below to answer the question. If it isn't relevant, say so.\n\nContext:\n${top}\n\nQuestion:\n${question}`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful SEO and rank & rent business expert.' },
        { role: 'user',   content: prompt }
      ]
    });

    const answer = chat.choices[0].message.content.trim();

    const log = fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : [];
    log.push({ timestamp: new Date().toISOString(), question, response: answer });
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));

    res.json({ answer });
  } catch (err) {
    console.error('/ask failed', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

/* -------------------- start ------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
