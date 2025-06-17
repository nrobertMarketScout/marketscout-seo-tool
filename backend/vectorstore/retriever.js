// backend/vectorstore/retriever.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { OpenAIEmbeddings } from './openai.js';
import { FAISS } from './faiss.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VECTORSTORE_DIR = path.join(__dirname, 'faiss_index');

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
