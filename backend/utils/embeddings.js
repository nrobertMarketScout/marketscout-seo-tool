// backend/utils/embeddings.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { OpenAI } from 'openai';
import { cosineSimilarity } from './math.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDINGS_PATH = path.join(__dirname, '../data/embeddings.json');
const CHUNKS_PATH = path.join(__dirname, '../data/chunks.json');
const CACHE_PATH = path.join(__dirname, '../data/embedding_cache.json');

let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    cache = {};
  }
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function getEmbedding(text) {
  const key = hash(text);
  if (cache[key]) return cache[key];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });

  const embedding = response.data[0].embedding;
  cache[key] = embedding;
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  return embedding;
}

export async function getRelevantChunks(query, topK = 5) {
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
  const embeddings = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));

  const queryEmbedding = await getEmbedding(query);
  const scored = embeddings.map((e, i) => ({
    score: cosineSimilarity(queryEmbedding, e),
    chunk: chunks[i]
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(entry => entry.chunk);
}
