// backend/vectorstore/retriever.js
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { FAISS } from 'langchain/vectorstores/faiss.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vectorstorePath = path.join(__dirname, 'faiss.index');

export async function loadRetriever() {
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  const vectorstore = await FAISS.load(vectorstorePath, embeddings);
  return vectorstore.asRetriever();
}
