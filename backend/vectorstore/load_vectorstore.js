// backend/vectorstore/load_vectorstore.js
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FAISS } from './faiss.js';
import { OpenAIEmbeddings } from './openai.js';
import { Document } from 'langchain/document';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VECTORSTORE_DIR = './backend/vectorstore/faiss_index';
const CHUNKS_PATH = path.join(__dirname, '..', 'chunks.json');

async function run() {
  try {
    const chunksRaw = JSON.parse(await fs.readFile(CHUNKS_PATH, 'utf-8'));

    const docs = chunksRaw.map(chunk =>
      new Document({
        pageContent: chunk.text,
        metadata: { source: chunk.source }
      })
    );

    const embeddings = new OpenAIEmbeddings();
    const vectorstore = await FAISS.fromDocuments(docs, embeddings);
    await vectorstore.save(VECTORSTORE_DIR);

    console.log('✅ Vectorstore created and saved.');
  } catch (err) {
    console.error('❌ Error generating vectorstore:', err);
  }
}

run();
