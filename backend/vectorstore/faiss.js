// backend/vectorstore/faiss.js
import * as fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from 'langchain/document';
import { VectorStore } from 'langchain/vectorstores/base';

export class FAISS extends VectorStore {
  _vectorstoreType() {
    return 'faiss'; // ✅ Must be a function in 0.0.189
  }

  constructor(embeddings, docstore, index) {
    super(embeddings, {});
    this.embeddings = embeddings;
    this.docstore = docstore;
    this.index = index;
  }

  static async fromDocuments(docs, embeddings) {
    const vectors = await embeddings.embedDocuments(docs.map(doc => doc.pageContent));
    const docstore = {};
    const ordered = [];

    docs.forEach((doc, i) => {
      const id = uuidv4();
      docstore[id] = doc;
      ordered.push({ id, vector: vectors[i] });
    });

    return new FAISS(embeddings, docstore, ordered);
  }

  async save(folder) {
    await fs.mkdir(folder, { recursive: true });

    const docsToSave = Object.entries(this.docstore).map(([id, doc]) => ({
      id,
      pageContent: doc.pageContent,
      metadata: doc.metadata
    }));

    await fs.writeFile(path.join(folder, 'docs.json'), JSON.stringify(docsToSave, null, 2));
    await fs.writeFile(path.join(folder, 'index.json'), JSON.stringify(this.index, null, 2));
  }

  static async load(folder, embeddings) {
    const docsRaw = JSON.parse(await fs.readFile(path.join(folder, 'docs.json')));
    const index = JSON.parse(await fs.readFile(path.join(folder, 'index.json')));
    const docstore = {};

    for (const { id, pageContent, metadata } of docsRaw) {
      docstore[id] = new Document({ pageContent, metadata });
    }

    return new FAISS(embeddings, docstore, index);
  }

  async similaritySearch(query, k = 4) {
    const queryVec = await this.embeddings.embedQuery(query);

    const scored = this.index.map(({ id, vector }) => {
      const doc = this.docstore[id];
      const score = vector.reduce((acc, val, i) => acc + val * queryVec[i], 0);
      return { doc, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(entry => entry.doc);
  }
}
