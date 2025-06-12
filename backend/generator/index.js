// backend/generator/index.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import archiver from 'archiver';

import buildSections     from './steps/buildSections.js';
import scrapeCompetitors from './steps/scrapeCompetitors.js';
import fetchUnsplash     from './steps/fetchUnsplash.js';        // ← new

/* ------------------------------------------------------------------ */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, 'templates');
const ORIGIN    = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

/* pre-compile templates once --------------------------------------- */
const featuresTpl = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'features.hbs'), 'utf8')
);
const whyTpl = Handlebars.compile(                       // ← new
  await fs.readFile(path.join(tplDir, 'why.hbs'), 'utf8')
);
/* ------------------------------------------------------------------ */

export default async function generateBundle(payload) {
  /* --- build baseline hero + services ---------------------------- */
  const { slug, indexPath } = await buildSections(payload);

  /* --- competitor feature cards ---------------------------------- */
  const features = await scrapeCompetitors({ slug, ...payload });

  /* --- Unsplash “Why Choose Us” images --------------------------- */
  const images = await fetchUnsplash(payload.city, payload.niche);

  /* --- inject both chunks into the final HTML -------------------- */
  let html = await fs.readFile(indexPath, 'utf8');

  html = html.replace(
    '<!--FEATURES-->',
    features.length ? featuresTpl({ features }) : ''
  );

  html = html.replace(
    '<!--WHY-->',
    images.length ? whyTpl({ images }) : ''
  );

  await fs.writeFile(indexPath, html, 'utf8');

  /* --- stub assets (ticket 3-C placeholder) ---------------------- */
  const dist      = path.dirname(indexPath);
  const assetsDir = path.join(dist, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'styles.css'), '/* placeholder */');
  await fs.writeFile(path.join(assetsDir, 'main.js'),   'console.log("Site loaded");');

  /* --- zip folder ------------------------------------------------ */
  const zipName   = `${slug}.zip`;
  const zipPath   = path.join(process.cwd(), 'uploads', zipName);
  const archive   = archiver('zip', { zlib: { level: 9 } });
  const zipStream = (await fs.open(zipPath, 'w')).createWriteStream();

  await new Promise((res, rej) =>
    archive.directory(dist, false).on('error', rej).pipe(zipStream).on('close', res) &&
    archive.finalize()
  );

  /* --- return payload for the UI -------------------------------- */
  return {
    success     : true,
    slug,
    previewUrl  : `${ORIGIN}/uploads/${slug}/index.html`,
    downloadUrl : `${ORIGIN}/uploads/${zipName}`,
    sourceUrl   : `${ORIGIN}/uploads/${slug}/index.html`,
    featureCount: features.length,
    imageCount  : images.length
  };
}
