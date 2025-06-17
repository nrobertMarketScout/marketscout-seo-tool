// backend/api/memory.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = express.Router();
const MEMORY_FILE = path.join(__dirname, '../data/memory.json');

// Ensure memory file exists
async function ensureMemoryFile() {
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, '[]', 'utf-8');
  }
}

// Load memory array from disk
async function loadMemory() {
  await ensureMemoryFile();
  const raw = await fs.readFile(MEMORY_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Save memory array to disk
async function saveMemory(items) {
  await fs.writeFile(MEMORY_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

// ─── GET /api/memory ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const memory = await loadMemory();
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load memory.' });
  }
});

// ─── POST /api/memory ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { question, text, summary, location, niches, csv, tags, source, type } = req.body;

  if (!question || (!text && !summary)) {
    return res.status(400).json({ error: 'Missing content' });
  }

  const payload = {
    role: 'assistant',
    question,
    type: type || (summary ? 'structured' : 'text'),
    content: summary || text,
    tags: tags || [],
    location: location || '',
    niches: niches || [],
    csv: csv || '',
    source: source || '',
    timestamp: new Date().toISOString()
  };

  try {
    const memory = await loadMemory();
    memory.unshift(payload); // Add new memory to top
    await saveMemory(memory);
    res.json({ success: true });
  } catch (err) {
    console.error('🧠 Memory write failed:', err);
    res.status(500).json({ error: 'Failed to save memory.' });
  }
});

export default router;
