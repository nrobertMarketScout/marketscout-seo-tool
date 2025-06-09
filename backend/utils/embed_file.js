// /backend/utils/embed_file.js
import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import { encoding_for_model } from 'tiktoken'

import { chunkText } from './chunk_text.js'
import { cosineSimilarity } from './math.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const encoder = encoding_for_model('gpt-4')

const CHUNK_PATH = path.join(process.cwd(), 'data', 'chunks.json')
const EMBEDDING_PATH = path.join(process.cwd(), 'data', 'embeddings.json')

/**
 * @param {string} text - Raw text to be chunked and embedded
 * @param {string} source - Optional source label for traceability
 */
export async function embedTextChunks(text, source = 'manual_upload') {
  const chunks = chunkText(text)

  const embeddings = []
  const enrichedChunks = []

  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: chunk
    })

    const embedding = response.data[0].embedding
    embeddings.push(embedding)

    enrichedChunks.push({
      text: chunk,
      source,
      timestamp: new Date().toISOString()
    })
  }

  const prevChunks = fs.existsSync(CHUNK_PATH)
    ? JSON.parse(fs.readFileSync(CHUNK_PATH, 'utf-8'))
    : []

  const prevEmbeddings = fs.existsSync(EMBEDDING_PATH)
    ? JSON.parse(fs.readFileSync(EMBEDDING_PATH, 'utf-8'))
    : []

  const updatedChunks = [...prevChunks, ...enrichedChunks]
  const updatedEmbeddings = [...prevEmbeddings, ...embeddings]

  fs.writeFileSync(CHUNK_PATH, JSON.stringify(updatedChunks, null, 2))
  fs.writeFileSync(EMBEDDING_PATH, JSON.stringify(updatedEmbeddings, null, 2))

  return {
    added: enrichedChunks.length,
    source
  }
}
