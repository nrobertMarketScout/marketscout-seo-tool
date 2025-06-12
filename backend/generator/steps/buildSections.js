// backend/generator/steps/buildSections.js  ← FULL FILE
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import slugify from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, '..', 'templates');

const heroTpl     = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'hero.hbs'), 'utf8')
);
const servicesTpl = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'services.hbs'), 'utf8')
);
const baseTpl     = Handlebars.compile(
  await fs.readFile(path.join(tplDir, 'base.hbs'), 'utf8')
);

export default async function buildSections(payload) {
  const { city, niche, hero, services = [] } = payload;

  /* ------- guarantee ≥1 service card ------- */
  const hasSvc   = /service(s)?$/i.test(niche.trim());
  const fallback = hasSvc ? niche : `${niche} service`;
  const svcList  = services.length ? services : [fallback];

  /* ------- NOTE the placeholder ↓ -------- */
  const bodyHTML = [
    heroTpl({ hero }),
    servicesTpl({ services: svcList }),
    '<!--FEATURES-->'                     // ← MUST remain exactly this
  ].join('\n');

  const page = baseTpl({ title: `${niche} in ${city}`, body: bodyHTML });

  const slug = slugify(`${city}-${niche}`);
  const dist = path.join(process.cwd(), 'uploads', slug);
  await fs.mkdir(dist, { recursive: true });

  const indexPath = path.join(dist, 'index.html');
  await fs.writeFile(indexPath, page, 'utf8');

  return { slug, indexPath };
}
