// backend/utils/embeddings.js
import fs from 'fs';
import path from 'path';
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

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
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
