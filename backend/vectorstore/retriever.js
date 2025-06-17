// backend/vectorstore/retriever.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { OpenAIEmbeddings } from './openai.js';
import { FAISS } from './faiss.js';
import { Document } from 'langchain/document';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VECTORSTORE_DIR = path.join(__dirname, 'faiss_index');
const CHUNKS_PATH = path.join(__dirname, '../data/chunks.json');

export async function loadRetriever() {
  try {
    const embeddings = new OpenAIEmbeddings();
    const vectorstore = await FAISS.load(VECTORSTORE_DIR, embeddings);
    return vectorstore.asRetriever();
  } catch (err) {
    console.error('❌ Failed to load FAISS vectorstore:', err);
    throw err;
  }
}

export async function buildVectorstore() {
  const raw = await fs.readFile(CHUNKS_PATH, 'utf-8');
  const chunks = JSON.parse(raw);

  const docs = chunks.map((chunk, idx) => {
    const metadata = {
      file: chunk.file || 'unknown',
      title: chunk.title || '',
      chunkIndex: idx
    };
    return new Document({ pageContent: chunk.text, metadata });
  });

  const embeddings = new OpenAIEmbeddings();
  const vectorstore = await FAISS.fromDocuments(docs, embeddings);
  await vectorstore.save(VECTORSTORE_DIR);
}
