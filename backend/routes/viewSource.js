import { Router } from 'express';
import path  from 'path';
import fs    from 'fs/promises';

const router = Router();
const root   = process.cwd();               // repo root

/**
 * GET /view-source?file=uploads/<slug>/index.html
 *
 * - requires that the path stays inside the project folder
 * - serves the file with text/plain for easy copy/paste
 */
router.get('/', async (req, res) => {
  try {
    const rel = req.query.file || '';
    if (!rel) return res.status(400).send('file query-param required');

    // never allow escaping outside the repo (../)
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(root)) return res.status(400).send('Invalid path');

    const txt = await fs.readFile(abs, 'utf8');
    res.type('text/plain').send(txt);
  } catch (err) {
    console.error('view-source error:', err.message);
    res.status(404).send('Not found');
  }
});

export default router;
