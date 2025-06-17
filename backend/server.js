// backend/server.js
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// — resolve correct __dirname and load the .env from project root —
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🛡️ Safe load for any working directory: always loads from root
dotenv.config({ path: path.resolve(__dirname, '../.env') })
console.log('[AUTH CHECK]', process.env.DATAFORSEO_LOGIN, process.env.DATAFORSEO_PASSWORD)

import express from 'express'
import cors    from 'cors'
import fs      from 'fs/promises'

// Core route modules
import runRoute         from './api/run.js'
import resultsRoute     from './api/results.js'
import summaryRoute     from './api/summary.js'
import matrixRoute      from './api/matrix.js'
import heatmapRoute     from './api/heatmap.js'
import botRoute         from './api/bot.js'
import ingestRoute      from './api/ingest.js'
import metaRoute        from './routes/meta.js'
import siteRoute        from './routes/site.js'
import serviceRoute     from './routes/services.js'
import apiDataForSEORoute from './routes/apiDataForSEO.js'
import vectorstoreRoute from './api/vectorstore.js';
import vectorstoreTest from './api/vectorstore_test.js';

// Upload modules
import rawRoute         from './routes/uploads/raw.js'
import compressRoute    from './routes/uploads/compress.js'

import { loadValidLocations } from './utils/locationValidator.js'

// ─── Initialize ───────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname)
const app  = express()
const PORT = process.env.PORT || 3001
loadValidLocations()

// ─── Confirm key loading ──────────────────────────────────────────────────────
console.log('⏳ TinyPNG API key is:', process.env.TINYPNG_API_KEY || process.env.TINIFY_API_KEY)

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ─── Serve static uploads ─────────────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.resolve(ROOT, 'uploads'), { extensions: ['html'] })
)

// ─── Core API routes ──────────────────────────────────────────────────────────
app.use('/api/run',        runRoute)
app.use('/api/results',    resultsRoute)
app.use('/api/summary',    summaryRoute)
app.use('/api/matrix',     matrixRoute)
app.use('/api/heatmap',    heatmapRoute)
app.use('/api/bot',        botRoute)
app.use('/api/ingest',     ingestRoute)
app.use('/api/meta',       metaRoute)
app.use('/api/site',       siteRoute)
app.use('/api/services',   serviceRoute)
app.use('/api/dataforseo', apiDataForSEORoute)
app.use('/api/vectorstore', vectorstoreRoute);
app.use('/api/vectorstore/test', vectorstoreTest);



// ─── Upload routes ────────────────────────────────────────────────────────────
app.use('/api/uploads/raw',      rawRoute)
app.use('/api/uploads/compress', compressRoute)

// ─── View-source utility ──────────────────────────────────────────────────────
app.get('/view-source', async (req, res) => {
  try {
    const rel  = req.query.file || ''
    const safe = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/,'')
    const abs  = path.resolve(ROOT, safe)
    const txt  = await fs.readFile(abs, 'utf8')
    res.type('text/plain').send(txt)
  } catch {
    res.status(404).send('File not found')
  }
})

// ─── Centralized error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack || err)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`)
})
