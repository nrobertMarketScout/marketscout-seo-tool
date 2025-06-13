// backend/routes/uploads/raw.js
import express      from 'express'
import multer       from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import streamifier  from 'streamifier'

const router = express.Router()
const upload = multer()   // in-memory buffer

// configure Cloudinary (unsigned preset “ml_default” must exist in your dashboard)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/uploads/raw
 * Expects multipart/form-data { file }
 * Streams directly to Cloudinary under an unsigned preset.
 */
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  try {
    const info = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          upload_preset: 'ml_default',
          folder:        'site-builder',
          resource_type: 'image',
        },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      streamifier.createReadStream(req.file.buffer).pipe(stream)
    })

    // Return the Cloudinary public_id so compress.js can pick it up
    res.json({ publicId: info.public_id })
  } catch (err) {
    console.error('Raw upload error:', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
