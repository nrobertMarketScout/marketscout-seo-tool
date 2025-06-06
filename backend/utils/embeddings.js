// backend/utils/embeddings.js
const fs = require('fs')
const path = require('path')
const { Configuration, OpenAIApi } = require('openai')
const { cosineSimilarity } = require('./math')

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
)

const EMBEDDINGS_PATH = path.join(__dirname, '../data/embeddings.json')
const CHUNKS_PATH = path.join(__dirname, '../data/chunks.json')

async function getEmbedding(text) {
  const response = await openai.createEmbedding({
    model: 'text-embedding-3-small',
    input: text
  })
  return response.data.data[0].embedding
}

async function getRelevantChunks(query, topK = 5) {
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'))
  const embeddings = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'))

  const queryEmbedding = await getEmbedding(query)
  const scored = embeddings.map((e, i) => ({
    score: cosineSimilarity(queryEmbedding, e),
    chunk: chunks[i]
  }))

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(entry => entry.chunk)
}

module.exports = { getRelevantChunks }
