// backend/generator/index.js
import fs              from 'fs/promises';
import path            from 'path';
import { fileURLToPath } from 'url';
import Handlebars      from 'handlebars';
import archiver        from 'archiver';

import buildSections      from './steps/buildSections.js';
import scrapeCompetitors  from './steps/scrapeCompetitors.js';
import fetchPexels        from './steps/fetchPexels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, 'templates');
const ORIGIN    = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';
const viewSite  = slug => `${ORIGIN}/uploads/${slug}/index.html`;

/* ──────────────────────────  Handlebars helpers ────────────────────────── */
Handlebars.registerHelper('trimService', txt =>
  String(txt).replace(/\s+service$/i, '')
);
/* ─────────────────────────────────────────────────────────────────────────── */

/* compile shared templates once */
const featuresTpl = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'features.hbs'), 'utf8')
);
const schemaTpl = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'schema.hbs'), 'utf8')
);

export default async function generateBundle (payload) {
  /* ------------------------------------------------------------------ */
  /* 1️⃣  Create basic folder + hero / services section                  */
  /* ------------------------------------------------------------------ */
  const { slug, indexPath } = await buildSections(payload);

  /* ------------------------------------------------------------------ */
  /* 2️⃣  Competitor cards  →  fallback to Pexels if SerpAPI quota hit   */
  /* ------------------------------------------------------------------ */
  let features = await scrapeCompetitors({ slug, ...payload });

  if (!features.length) {
    const imgs = await fetchPexels(payload.niche);
    features   = imgs.map(url => ({ img: url }));
  }

  /* ------------------------------------------------------------------ */
  /* 3️⃣  Inject feature gallery & JSON-LD schema                        */
  /* ------------------------------------------------------------------ */
  const rawHtml     = await fs.readFile(indexPath, 'utf8');

  const htmlWithGal = rawHtml.replace(
    '<!--FEATURES-->',
    featuresTpl({ features })
  );

  const schemaBlock = schemaTpl({
    businessName : `${payload.niche} – ${payload.city}`,
    phone        : payload.phone || undefined,
    city         : payload.city,
    state        : payload.state || '',
    niche        : payload.niche,
    url          : viewSite(slug)
  });

  const finalHtml   = htmlWithGal.replace('<!--SCHEMA-->', schemaBlock);
  await fs.writeFile(indexPath, finalHtml, 'utf8');

  /* ------------------------------------------------------------------ */
  /* 4️⃣  Stub asset folder (reserved for Ticket 3-C)                    */
  /* ------------------------------------------------------------------ */
  const dist      = path.dirname(indexPath);
  const assetsDir = path.join(dist, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'styles.css'), '/* placeholder */');
  await fs.writeFile(path.join(assetsDir, 'main.js'),   'console.log("Site loaded");');

  /* ------------------------------------------------------------------ */
  /* 5️⃣  ZIP the site for download                                      */
  /* ------------------------------------------------------------------ */
  const zipName   = `${slug}.zip`;
  const zipPath   = path.join(process.cwd(), 'uploads', zipName);
  const archive   = archiver('zip', { zlib: { level: 9 } });
  const zipStream = (await fs.open(zipPath, 'w')).createWriteStream();

  await new Promise((res, rej) =>
    archive.directory(dist, false).on('error', rej).pipe(zipStream).on('close', res) &&
    archive.finalize()
  );

  /* ------------------------------------------------------------------ */
  /* 6️⃣  Return bundle metadata                                         */
  /* ------------------------------------------------------------------ */
  return {
    success      : true,
    slug,
    previewUrl   : viewSite(slug),
    downloadUrl  : `${ORIGIN}/uploads/${zipName}`,
    sourceUrl    : viewSite(slug),
    imageCount   : features.length,
    featureCount : features.length
  };
}
