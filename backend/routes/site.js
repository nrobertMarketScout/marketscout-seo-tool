/* eslint-disable camelcase */
import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import SiteContentChain from '../services/SiteContentChain.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// helpers ----------------------------------------------------
function htmlTemplate({ seo_title, meta_description, heading, intro_section, phone }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${seo_title}</title>
  <meta name="description" content="${meta_description}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 font-sans leading-relaxed tracking-wide p-8">
  <main class="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-10">
    <h1 class="text-3xl font-bold text-indigo-600 mb-4">${heading}</h1>
    <p class="text-gray-800 mb-6">${intro_section}</p>
    <a href="tel:${phone}" class="inline-flex items-center px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition">
      Call Now → ${phone}
    </a>
  </main>
</body>
</html>`;
}

// POST /api/site ------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { city, niche, competitors, phone, writingStyle = 'professional' } = req.body;

    if (!city || !niche) {
      return res.status(400).json({ error: 'city and niche are required' });
    }

    // 1) use LangChain SiteContentChain (RAG over transcripts + competitor notes)
    const content = await SiteContentChain({ city, niche, competitors, phone, writingStyle });

    // 2) build HTML
    const html = htmlTemplate({ ...content, phone });

    // 3) persist for download / preview
    const slug   = slugify(`${city}-${niche}-${nanoid(6)}`, { lower: true });
    const outDir = path.join(process.cwd(), 'sites');
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `${slug}.html`);
    await fs.writeFile(filePath, html, 'utf8');

    // 4) respond
    res.json({
      success: true,
      slug,
      downloadUrl: `/api/site/download/${slug}`,
      previewUrl : `/sites/${slug}.html`,
      content    // front-end may show generated fields
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Site generation failed' });
  }
});

// GET /api/site/download/:slug  -------------------------------
router.get('/download/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(process.cwd(), 'sites', `${slug}.html`);
    res.download(filePath, `${slug}.html`);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});
// GET /api/site/source/:slug  -------------------------------
router.get('/source/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(process.cwd(), 'sites', `${slug}.html`);
    const html     = await fs.readFile(filePath, 'utf8');
    res.type('text/plain').send(html);
  } catch (err) {
    res.status(404).send('Source not found');
  }
});


export default router;
