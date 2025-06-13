// backend/generator/steps/buildSections.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tplDir    = path.join(__dirname, '../templates');

// Compile each template once:
const baseTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'base.hbs'), 'utf8'));
const heroTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'hero.hbs'), 'utf8'));
const servicesTpl = Handlebars.compile(await fs.readFile(path.join(tplDir, 'services.hbs'), 'utf8'));

export default async function buildSections({ city, niche, hero, services }) {
  // 1️⃣ build slug & create folder
  const slug = `${city}-${niche}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const dist = path.join(process.cwd(), 'uploads', slug);
  await fs.mkdir(dist, { recursive: true });

  // 2️⃣ render hero — NOTE we pass an object called “hero”
  const heroHtml = heroTpl({
    hero: {
      heading: hero.heading || '',
      sub:     hero.sub     || '',
      image:   hero.img     || ''    // <- this must match {{hero.image}} below
    }
  });

  // 3️⃣ render services grid
  const servicesHtml = servicesTpl({ services });

  // 4️⃣ assemble body, including placeholders for FEATURES & SCHEMA
  const body = [
    heroHtml,
    servicesHtml,
    '<!--FEATURES-->',
    '<!--SCHEMA-->'
  ].join('\n');

  // 5️⃣ wrap in base layout
  const html = baseTpl({
    title: `${niche} in ${city}`,
    body
  });

  // 6️⃣ write index.html
  const indexPath = path.join(dist, 'index.html');
  await fs.writeFile(indexPath, html, 'utf8');

  return { slug, indexPath };
}
