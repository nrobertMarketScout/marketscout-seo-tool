// backend/routes/uploads/compress.js
import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import tinify              from 'tinify'
import fetch               from 'node-fetch'

const router = express.Router()

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ── TinyPNG config ────────────────────────────────────────────────────────────
tinify.key = process.env.TINYPNG_API_KEY || process.env.TINIFY_API_KEY
if (!tinify.key) {
  console.warn('⚠️  Warning: TinyPNG key not set (TINYPNG_API_KEY or TINIFY_API_KEY)')
}

/**
 * POST /api/uploads/compress
 * { publicId: string }
 */
router.post('/', async (req, res) => {
  const { publicId } = req.body
  if (!publicId) {
    return res.status(400).json({ error: 'publicId missing' })
  }

  try {
    // 1️⃣ Look up the real Cloudinary resource metadata
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image'
    })
    const origUrl = resource.secure_url
    if (!origUrl) {
      throw new Error('Could not get secure_url from Cloudinary resource')
    }

    // 2️⃣ Fetch the binary
    const resp = await fetch(origUrl)
    if (!resp.ok) {
      throw new Error(`Failed to download original: ${resp.status}`)
    }
    const buffer = Buffer.from(await resp.arrayBuffer())

    // 3️⃣ Compress via TinyPNG
    const source = tinify.fromBuffer(buffer)
    const tinyBuffer = await source.toBuffer()

    // 4️⃣ Convert to data URI
    const dataUri = `data:image/png;base64,${tinyBuffer.toString('base64')}`
    const tinyId  = `${publicId}_tiny`

    // 5️⃣ Re-upload compressed image to Cloudinary
    const info = await cloudinary.uploader.upload(dataUri, {
      public_id:     tinyId,
      overwrite:     true,
      resource_type: 'image'
    })

    // 6️⃣ Return the final secure URL
    return res.json({ url: info.secure_url })
  } catch (err) {
    console.error('🔴 compress route error:', err.message || err)
    return res.status(500).json({ error: err.message || 'Compression failed' })
  }
})

export default router
