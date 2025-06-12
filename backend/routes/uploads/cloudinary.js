import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// pull creds from .env
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

/**
 * Returns a one-time signed upload preset so the frontend can POST the file
 * directly to https://api.cloudinary.com/v1_1/<cloud>/image/upload
 */
router.get('/signature', (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `timestamp=${timestamp}&upload_preset=ml_default${CLOUDINARY_API_SECRET}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign)
    .digest('hex');

  res.json({
    cloudName : CLOUDINARY_CLOUD_NAME,
    apiKey    : CLOUDINARY_API_KEY,
    timestamp,
    signature,
    uploadPreset: 'ml_default'
  });
});

export default router;
