// backend/lib/proxyImage.js
import crypto from 'crypto';

/**
 * Convert any external image URL into a Cloudinary **fetch** URL so that
 * the browser loads through Cloudinary (avoids CORS / mixed-content issues).
 *
 * Requires a single env var:
 *   CLOUDINARY_CLOUD_NAME=<your-cloud>
 */
export default function proxyImage (rawUrl) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) {
    throw new Error('CLOUDINARY_CLOUD_NAME missing in .env');
  }

  // Add a short hash so repeated URLs don’t collide in Cloudinary cache
  const hash = crypto.createHash('md5').update(rawUrl).digest('hex').slice(0, 6);
  const safe = encodeURIComponent(rawUrl);

  // auto-format + auto-quality keeps images lightweight
  return `https://res.cloudinary.com/${cloud}/image/fetch/f_auto,q_auto/${hash}/${safe}`;
}
