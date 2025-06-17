// backend/vectorstore/load_vectorstore.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, '../chunks.json');
const VECTORSTORE_DIR = path.join(__dirname, '../vectorstore');

async function loadChunksAndSaveVectorstore() {
  const langchain = await import('langchain');
  const FAISS = langchain.FAISS;

  const raw = await fs.readFile(CHUNKS_PATH, 'utf-8');
  const chunks = JSON.parse(raw);

  const docs = chunks.map((chunk, i) => new Document({
    pageContent: chunk.content || '',
    metadata: {
      source: chunk.source || `chunk_${i}`,
      index: i
    }
  }));

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  const vectorstore = await FAISS.fromDocuments(docs, embeddings);

  await fs.mkdir(VECTORSTORE_DIR, { recursive: true });
  await vectorstore.save(VECTORSTORE_DIR);

  console.log(`✅ Vectorstore saved to ${VECTORSTORE_DIR}`);
}

loadChunksAndSaveVectorstore().catch(err => {
  console.error('❌ Error generating vectorstore:', err);
});
