import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import slugify from '../utils/slugify.js';

/* register partials once */
const tplDir = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'templates');
const heroTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'hero.hbs'), 'utf8'));
const servicesTpl = Handlebars.compile(await fs.readFile(path.join(tplDir, 'services.hbs'), 'utf8'));
const baseTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir, 'base.hbs'), 'utf8'));

export default async function buildSections(payload) {
  const { city, niche, hero, services } = payload;

  const heroHTML     = heroTpl({ hero });
  const servicesHTML = services?.length ? servicesTpl({ services }) : '';

  const html = baseTpl({
    title : `${niche} in ${city}`,
    body  : `${heroHTML}\n${servicesHTML}`
  });

  /* write to dist/<slug>/index.html */
  const slug = slugify(`${city}-${niche}`);
  const dist = path.join(process.cwd(), 'uploads', slug);
  await fs.mkdir(dist, { recursive: true });
  await fs.writeFile(path.join(dist, 'index.html'), html, 'utf8');

  return { slug, indexPath: path.join(dist, 'index.html') };
}
