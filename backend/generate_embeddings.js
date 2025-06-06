// generate_embeddings.js

import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import { encoding_for_model } from 'tiktoken'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const __dirname = path.dirname(new URL(import.meta.url).pathname)

const transcriptsDir = path.join(__dirname, 'data', 'transcripts')
const outputChunksPath = path.join(__dirname, 'data', 'chunks.json')
const outputEmbeddingsPath = path.join(__dirname, 'data', 'embeddings.json')
const embeddingStatePath = path.join(__dirname, 'data', 'embedding_state.json')
const encoder = encoding_for_model('gpt-4')
const MAX_TOKENS = 800

// Load existing embedding state
let embeddingState = {}
if (fs.existsSync(embeddingStatePath)) {
  try {
    embeddingState = JSON.parse(fs.readFileSync(embeddingStatePath, 'utf-8'))
  } catch {
    console.warn('⚠️ Could not parse embedding_state.json, starting fresh.')
    embeddingState = {}
  }
}

function readTranscript(filePath) {
  const ext = path.extname(filePath)
  const content = fs.readFileSync(filePath, 'utf-8')

  try {
    if (ext === '.json') {
      const json = JSON.parse(content)
      if (json.segments && Array.isArray(json.segments)) {
        return json.segments.map(seg => seg.text).join(' ')
      }
    } else if (ext === '.vtt' || ext === '.srt') {
      return content
        .split(/\n\n+/)
        .map(block => block.split('\n').slice(1).join(' '))
        .join(' ')
    } else if (ext === '.txt') {
      return content
    }
  } catch (err) {
    console.warn(`⚠️ Error reading ${filePath}:`, err.message)
  }
  return ''
}

function chunkText(text, maxTokens) {
  const words = text.split(' ')
  const chunks = []
  let chunk = []

  for (let word of words) {
    chunk.push(word)
    const tokenCount = encoder.encode(chunk.join(' ')).length
    if (tokenCount > maxTokens) {
      chunk.pop()
      chunks.push(chunk.join(' '))
      chunk = [word]
    }
  }
  if (chunk.length) chunks.push(chunk.join(' '))
  return chunks
}

async function generateEmbeddings() {
  const files = fs.readdirSync(transcriptsDir)
  const seen = new Set()
  const allChunks = []
  const embeddings = []

  for (const file of files) {
    const base = path.basename(file, path.extname(file))
    if (seen.has(base)) continue
    seen.add(base)

    const matchFile = files.find(
      f => path.basename(f, path.extname(f)) === base
    )
    const filePath = path.join(transcriptsDir, matchFile)
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtime.toISOString()

    if (embeddingState[matchFile] === lastModified) {
      console.log(`⏭️ Skipping ${matchFile}, already embedded.`)
      continue
    }

    const text = readTranscript(filePath)
    if (!text.trim()) continue

    const chunks = chunkText(text, MAX_TOKENS)
    for (const chunk of chunks) {
      allChunks.push({ source: base, text: chunk })
      try {
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: chunk
        })
        embeddings.push(embedding.data[0].embedding)
        console.log(`✅ Embedded chunk for ${base}`)
      } catch (err) {
        console.error(`❌ Error embedding chunk for ${base}:`, err)
      }
    }

    embeddingState[matchFile] = lastModified
  }

  fs.writeFileSync(outputChunksPath, JSON.stringify(allChunks, null, 2))
  fs.writeFileSync(outputEmbeddingsPath, JSON.stringify(embeddings))
  fs.writeFileSync(embeddingStatePath, JSON.stringify(embeddingState, null, 2))

  console.log(
    `\n✅ Done! Saved ${allChunks.length} chunks from ${seen.size} file(s).`
  )
}

generateEmbeddings().catch(console.error)
