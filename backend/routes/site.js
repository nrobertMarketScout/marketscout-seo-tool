import { Router } from 'express';
import path from 'path';
import fs from 'fs';              // stream methods
import fsp from 'fs/promises';    // promise helpers
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import archiver from 'archiver';
import SiteContentChain from '../services/SiteContentChain.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const sitesDir   = path.join(process.cwd(), 'sites');

// helper – write a file
async function writeFile(outPath, html) {
  await fsp.mkdir(path.dirname(outPath), { recursive: true });
  await fsp.writeFile(outPath, html, 'utf8');
}

/* ------------------------------------------------------------------ *
 *  POST /api/site        → one-pager (“lite”)
 *  POST /api/site/full   → multi-page site + ZIP
 * ------------------------------------------------------------------ */

// 1 · Lite
router.post('/', async (req, res) => {
  try {
    const { city, niche, competitors, phone, writingStyle = 'professional' } = req.body;
    if (!city || !niche) return res.status(400).json({ error: 'city & niche required' });

    const slug = slugify(`${city}-${niche}-${nanoid(6)}`, { lower: true });
    const html = await SiteContentChain({ city, niche, competitors, phone, writingStyle, pageType: 'index' });

    await writeFile(path.join(sitesDir, `${slug}.html`), html);

    res.json({
      success    : true,
      slug,
      previewUrl : `/sites/${slug}.html`,
      downloadUrl: `/api/site/download/${slug}`,
      content    : html
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Site generation failed' });
  }
});

// 2 · Full-site
router.post('/full', async (req, res) => {
  try {
    const { city, niche, competitors, phone, writingStyle = 'professional' } = req.body;
    if (!city || !niche) return res.status(400).json({ error: 'city & niche required' });

    const slug      = slugify(`${city}-${niche}-${nanoid(6)}`, { lower: true });
    const fullDir   = path.join(sitesDir, 'full', slug);
    const pages     = ['index', 'services', 'about', 'contact'];
    const pageFiles = [];

    for (const page of pages) {
      const html = await SiteContentChain({ city, niche, competitors, phone, writingStyle, pageType: page });
      const file = path.join(fullDir, `${page}.html`);
      await writeFile(file, html);
      pageFiles.push(file);
    }

    // zip it
    const zipPath = path.join(sitesDir, 'full', `${slug}.zip`);
    await new Promise((resolve, reject) => {
      const output  = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);
      pageFiles.forEach((file) => archive.file(file, { name: path.basename(file) }));
      archive.finalize();
      output.on('close', resolve);
      archive.on('error', reject);
    });

    res.json({
      success    : true,
      slug,
      previewUrl : `/sites/full/${slug}/index.html`,
      downloadUrl: `/api/site/full/download/${slug}`,
      zipUrl     : `/sites/full/${slug}.zip`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Full-site generation failed' });
  }
});

// download endpoints
router.get('/download/:slug', (req, res) => {
  res.download(path.join(sitesDir, `${req.params.slug}.html`));
});
router.get('/full/download/:slug', (req, res) => {
  res.download(path.join(sitesDir, 'full', `${req.params.slug}.zip`));
});

 // plain-text source – one-pager
 router.get('/source/:slug', async (req, res) => {
   const file = path.join(sitesDir, `${req.params.slug}.html`);
   try {
     const html = await fsp.readFile(file, 'utf8');
     res.type('text/plain').send(html);
   } catch {
     res.status(404).send('Source not found');
   }
 });

 // plain-text source – full-site specific page
 router.get('/source/:slug/:page', async (req, res) => {
   const { slug, page } = req.params;
   const file = path.join(sitesDir, 'full', slug, `${page}.html`);
   try {
     const html = await fs.readFile(file, 'utf8');
     res.type('text/plain').send(html);
   } catch {
     res.status(404).send('Source not found');
   }
 });

// competitor pre-fill
import summaryRouter from '../api/summary.js';
router.get('/competitors', async (req, res) => {
  const { city, niche } = req.query;
  try {
    const data = await summaryRouter.getSummaryJSON();             // helper exported in summary route
    const rows = data.filter(r => r.Location === city && r.Group === niche);
    const urls = [...new Set(rows.map(r => r.Website).filter(Boolean))].slice(0, 3);
    res.json({ urls });
  } catch {
    res.json({ urls: [] });
  }
});


router.post('/bundle', async (req, res) => {
  try {
    const result = await generateBundle(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('/bundle error', err.message);
    res.status(501).json({ success: false, error: err.message });
  }
});

export default router;
