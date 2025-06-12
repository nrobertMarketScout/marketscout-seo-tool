import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

import buildSections     from './steps/buildSections.js';
import scrapeCompetitors from './steps/scrapeCompetitors.js';
import fetchPexels     from './steps/fetchPexels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, 'templates');
const ORIGIN    = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

Handlebars.registerHelper('trimService', txt =>
  String(txt).replace(/\s+service$/i, '')
);

const featuresTpl = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'features.hbs'), 'utf8')
);

export default async function generateBundle (payload) {
  const { slug, indexPath } = await buildSections(payload);

  /* --- feature images (competitor or Unsplash) ------------------ */
  let features = await scrapeCompetitors({ slug, ...payload });

  if (!features.length) {
    const imgs = await fetchPexels(payload.niche.toLowerCase());
    features   = imgs.map(img => ({ img }));
  }

  /* --- inject gallery ------------------------------------------- */
  const htmlSrc = await fs.readFile(indexPath, 'utf8');
  const htmlOut = htmlSrc.replace('<!--FEATURES-->', featuresTpl({ features }));
  await fs.writeFile(indexPath, htmlOut, 'utf8');

  return {
    success    : true,
    slug,
    previewUrl : `${ORIGIN}/uploads/${slug}/index.html`
  };
}
