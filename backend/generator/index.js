// backend/generator/index.js
import fs              from 'fs/promises';
import path            from 'path';
import { fileURLToPath } from 'url';
import Handlebars      from 'handlebars';
import archiver        from 'archiver';

import buildSections     from './steps/buildSections.js';   // your working pipeline
import scrapeCompetitors from './steps/scrapeCompetitors.js';
import fetchPexels       from './steps/fetchPexels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN    = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

export default async function generateBundle(payload) {
  // ── 1) Build slug & index.html with Hero → Services → <!--FEATURES-->
  const { slug, indexPath } = await buildSections(payload);

  // ── 2) Fetch competitor images or fallback to Pexels
  let features = await scrapeCompetitors({ slug, ...payload });
  if (!features.length) {
    const imgs = await fetchPexels(payload.niche);
    features   = imgs.map(img => ({ img }));
  }
  // ── 3) Insert those into the output
  const featuresHtml = Handlebars.compile(
    await fs.readFile(path.join(__dirname, 'templates', 'features.hbs'), 'utf8')
  )({ features });
  let html = await fs.readFile(indexPath, 'utf8');
  html = html.replace('<!--FEATURES-->', featuresHtml);

  // ── 4) Inject your JSON-LD schema immediately *after* the Why Choose Us
  const [cityName, stateCode = ''] = payload.city.split(',').map(s => s.trim());
  const schemaJson = {
    "@context": "https://schema.org",
    "@type":    "LocalBusiness",
    name:       `${payload.niche} – ${payload.city}`,
    address: {
      "@type":           "PostalAddress",
      addressLocality:  cityName,
      addressRegion:    stateCode,
      addressCountry:   "US"
    },
    areaServed: { "@type": "City", name: payload.city },
    serviceType: payload.niche,
    url:         `${ORIGIN}/uploads/${slug}/index.html`
  };
  const schemaBlock = `<script type="application/ld+json">
${JSON.stringify(schemaJson, null, 2)}
</script>`;
  html = html.replace('<!--SCHEMA-->', schemaBlock);

  // ── 5) Write it back
  await fs.writeFile(indexPath, html, 'utf8');

  // ── 6) Zip your folder as before
  const dist      = path.dirname(indexPath);
  const zipName   = `${slug}.zip`;
  const zipPath   = path.join(process.cwd(), 'uploads', zipName);
  const archive   = archiver('zip', { zlib: { level: 9 } });
  const zipStream = (await fs.open(zipPath, 'w')).createWriteStream();
  await new Promise((res, rej) =>
    archive.directory(dist, false).on('error', rej).pipe(zipStream).on('close', res) &&
    archive.finalize()
  );

  // ── 7) Return exactly what your front-end expects
  return {
    success:     true,                           // <-- this must be a literal `true`
    slug,
    previewUrl:  `${ORIGIN}/uploads/${slug}/index.html`,
    downloadUrl: `${ORIGIN}/uploads/${slug}.zip`,
    sourceUrl:   `${ORIGIN}/view-source?file=uploads/${slug}/index.html`,
    imageCount:   features.length,
    featureCount: features.length
  };
}
