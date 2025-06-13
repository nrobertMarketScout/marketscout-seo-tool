// backend/server.js
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// — load the .env at the project root (one level up from backend/) —
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import express from 'express'
import cors    from 'cors'
import fs      from 'fs/promises'

// your existing imports…
import runRoute       from './api/run.js'
import resultsRoute   from './api/results.js'
import summaryRoute   from './api/summary.js'
import matrixRoute    from './api/matrix.js'
import heatmapRoute   from './api/heatmap.js'
import botRoute       from './api/bot.js'
import ingestRoute    from './api/ingest.js'
import metaRoute      from './routes/meta.js'
import siteRoute      from './routes/site.js'
import serviceRoute   from './routes/services.js'

// only these under /api/uploads
import rawRoute       from './routes/uploads/raw.js'
import compressRoute  from './routes/uploads/compress.js'

const ROOT = path.resolve(__dirname)  // now points at backend/, .env loaded from project root
const app  = express()
const PORT = process.env.PORT || 3001

// ─── Log out the TinyPNG/ Tinify key for sanity check ─────────────────────────
console.log('⏳ TinyPNG API key is:', process.env.TINYPNG_API_KEY || process.env.TINIFY_API_KEY)

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ─── Serve generated sites & ZIPs ─────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.resolve(ROOT, 'uploads'), { extensions: ['html'] })
)

// ─── Core API routes ──────────────────────────────────────────────────────────
app.use('/api/run',      runRoute)
app.use('/api/results',  resultsRoute)
app.use('/api/summary',  summaryRoute)
app.use('/api/matrix',   matrixRoute)
app.use('/api/heatmap',  heatmapRoute)
app.use('/api/bot',      botRoute)
app.use('/api/ingest',   ingestRoute)
app.use('/api/meta',     metaRoute)
app.use('/api/site',     siteRoute)
app.use('/api/services', serviceRoute)

// ─── Uploads routes ───────────────────────────────────────────────────────────
// 1️⃣ Receive file → stream to Cloudinary
app.use('/api/uploads/raw', rawRoute)
// 2️⃣ Compress existing upload via TinyPNG + re-upload to Cloudinary
app.use('/api/uploads/compress', compressRoute)

// ─── View-source helper ───────────────────────────────────────────────────────
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
