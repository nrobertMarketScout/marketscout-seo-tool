// backend/generator/steps/buildSections.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, '../templates');

// Compile each piece once
const baseTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'base.hbs'), 'utf8'));
const heroTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'hero.hbs'), 'utf8'));
const servicesTpl = Handlebars.compile(await fs.readFile(path.join(tplDir, 'services.hbs'), 'utf8'));

export default async function buildSections({ city, niche, hero, services }) {
  // 1️⃣  Build slug & directory
  const slug = `${city}-${niche}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const dist = path.join(process.cwd(), 'uploads', slug);
  await fs.mkdir(dist, { recursive: true });

  // 2️⃣  Render hero section
  const heroHtml = heroTpl({
    heading: hero.heading || '',
    sub:     hero.sub     || '',
    img:     hero.img     || ''
  });

  // 3️⃣  Render services grid
  //    NOTE: we pass the raw array of strings directly
  const servicesHtml = servicesTpl({
    services
  });

  // 4️⃣  Assemble the full body, including BOTH placeholders
  const body = [
    heroHtml,
    servicesHtml,
    '<!--FEATURES-->',
    '<!--SCHEMA-->'
  ].join('\n');

  // 5️⃣  Wrap in base layout
  const html = baseTpl({
    title: `${niche} in ${city}`,
    body
  });

  // 6️⃣  Write out index.html
  const indexPath = path.join(dist, 'index.html');
  await fs.writeFile(indexPath, html, 'utf8');

  return { slug, indexPath };
}
