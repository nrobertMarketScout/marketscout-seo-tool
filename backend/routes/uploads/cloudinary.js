// backend/routes/uploads/cloudinary.js
import { Router } from 'express';
import crypto from 'crypto';
import cloudinary from 'cloudinary';

// ---------------------------------------------------------------------------
//  0.  Cloudinary config (from .env)
// ---------------------------------------------------------------------------
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key   : process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const router = Router();

// ---------------------------------------------------------------------------
//  1.  POST /api/uploads/image
//      return a *signed* URL the browser can PUT the raw file to
// ---------------------------------------------------------------------------
router.post('/image', async (req, res) => {
  try {
    const { name = '', type = '' } = req.body;
    if (!name || !type) throw new Error('Missing name / type');

    // create a short random publicId, keep extension
    const ext       = name.split('.').pop();
    const publicId  = `hero_${crypto.randomBytes(4).toString('hex')}`;

    // ask Cloudinary for a signed upload URL (expires in 60 s)
    const { signature, timestamp, api_key } =
      cloudinary.v2.utils.api_sign_request(
        { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) + 55 },
        cloudinary.v2.config().api_secret
      );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/auto/upload` +
      `?public_id=${publicId}&api_key=${api_key}&timestamp=${timestamp}&signature=${signature}`;

    res.json({ uploadUrl, publicId: `${publicId}.${ext}` });
  } catch (err) {
    console.error('Cloudinary pre-sign error:', err.message);
    res.status(500).json({ error: 'Could not create upload URL' });
  }
});

// ---------------------------------------------------------------------------
//  2.  POST /api/uploads/compress
//      TinyPNG → lossless-compress a file that is **already** in Cloudinary
// ---------------------------------------------------------------------------
import tinify from 'tinify';
tinify.key = process.env.TINIFY_API_KEY;

router.post('/compress', async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) throw new Error('publicId missing');

    // ► download from Cloudinary to Tinify
    const originalUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/${publicId}`;
    const compressed  = await tinify.fromUrl(originalUrl).toBuffer();

    // ► overwrite the same publicId (PUT) – Cloudinary accepts raw binary
    const cloudUploadUrl =
      `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/image/upload` +
      `?public_id=${publicId}&overwrite=true`;

    await fetch(cloudUploadUrl, {
      method : 'POST',
      body   : compressed,
      headers: { 'Content-Type': 'application/octet-stream' }
    });

    res.json({ url: originalUrl, publicId });
  } catch (err) {
    console.error('TinyPNG compress error:', err.message);
    res.status(500).json({ error: 'Compression failed' });
  }
});

export default router;
