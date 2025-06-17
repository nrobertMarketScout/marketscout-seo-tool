import { FAISS } from './faiss.js';
import { OpenAIEmbeddings } from './openai.js';

const VECTORSTORE_DIR = './backend/vectorstore/faiss_index';

async function testQuery() {
  const embeddings = new OpenAIEmbeddings();
  const vectorstore = await FAISS.load(VECTORSTORE_DIR, embeddings);

  const results = await vectorstore.similaritySearch('What are the steps to pricing a client?');
  for (const doc of results) {
    console.log('🔍 Match:', doc.pageContent.slice(0, 120), '...');
  }
}

testQuery();
