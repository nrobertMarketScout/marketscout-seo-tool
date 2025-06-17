// backend/lib/vectorstore.js
import fs from 'fs/promises';
import path from 'path';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { FAISS } from 'langchain/vectorstores/faiss';
import { Document } from 'langchain/document';

const CHUNKS_PATH = path.join(process.cwd(), 'chunks.json');
const VECTOR_PATH = path.join(process.cwd(), 'vectorstore');

export async function buildOrLoadVectorStore () {
  const embeddings = new OpenAIEmbeddings();

  // Try loading existing store
  try {
    const store = await FAISS.load(VECTOR_PATH, embeddings);
    console.log('✅ FAISS vectorstore loaded from disk');
    return store;
  } catch {
    console.warn('⚠️ No existing FAISS vectorstore found, building from chunks.json...');
  }

  const raw = await fs.readFile(CHUNKS_PATH, 'utf-8');
  const chunks = JSON.parse(raw);

  const docs = chunks.map(c => new Document({ pageContent: c.content, metadata: c.metadata }));
  const store = await FAISS.fromDocuments(docs, embeddings);
  await store.save(VECTOR_PATH);
  console.log('✅ FAISS vectorstore built and saved');

  return store;
}
