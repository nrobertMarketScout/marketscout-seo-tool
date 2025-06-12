// backend/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors     from 'cors';
import fs       from 'fs/promises';
import path     from 'path';
import { fileURLToPath } from 'url';

import runRoute      from './api/run.js';
import resultsRoute  from './api/results.js';
import summaryRoute  from './api/summary.js';
import matrixRoute   from './api/matrix.js';
import heatmapRoute  from './api/heatmap.js';
import botRoute      from './api/bot.js';
import ingestRoute   from './api/ingest.js';
import metaRoute     from './routes/meta.js';
import siteRoute     from './routes/site.js';
import uploadRoute   from './routes/uploads/cloudinary.js';
import serviceRoute  from './routes/services.js';
import viewSource from './routes/viewSource.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3001;

/* ───────── middleware ───────── */
app.use(cors());
app.use(express.json());

/* ───────── static previews ───── */
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

/* ───────── api routes ────────── */
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
app.use('/view-source', viewSource);


/* ───────── view-source helper ──
   Example: /view-source?file=uploads/slug/index.html
*/
app.get('/view-source', async (req, res) => {
  try {
    const rel  = req.query.file || '';
    const safe = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, ''); // strip ../
    const file = path.join(ROOT, safe);

    const txt  = await fs.readFile(file, 'utf8');
    res.type('text/plain').send(txt);
  } catch (err) {
    res.status(404).send('File not found');
  }
});

/* ───────── start server ──────── */
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
