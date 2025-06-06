// server.js

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { ConversationChain } from 'langchain/chains'
import { BufferMemory } from 'langchain/memory'
import { ChatOpenAI } from 'langchain/chat_models/openai'

dotenv.config()
const app = express()
const port = 5001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const dataDir = path.resolve('data')
const chunksPath = path.join(dataDir, 'chunks.json')
const embeddingsPath = path.join(dataDir, 'embeddings.json')

let vectorStore = null
let memory = new BufferMemory({ returnMessages: true, memoryKey: 'chat_history' })

async function loadVectorStore() {
  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'))
  const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'))
  vectorStore = new MemoryVectorStore(new OpenAIEmbeddings(), { similarityThreshold: 0.7 })
  await Promise.all(
    chunks.map(async (chunk, i) => {
      await vectorStore.addDocuments([{ pageContent: chunk.text, metadata: { source: chunk.source } }], [embeddings[i]])
    })
  )
}

await loadVectorStore()
console.log(`✅ Vector store loaded with ${vectorStore.memoryVectors.length} items.`)

const chain = new ConversationChain({
  llm: new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 }),
  memory,
})

app.post('/ask', async (req, res) => {
  const { question } = req.body
  try {
    const relevant = await vectorStore.similaritySearch(question, 5)
    const context = relevant.map(doc => doc.pageContent).join('\n\n')
    const prompt = `Context:\n${context}\n\nQuestion: ${question}`
    const result = await chain.call({ input: prompt })
    res.json({ answer: result.response })
  } catch (err) {
    console.error('Error handling /ask:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.listen(port, () => console.log(`🟢 Server ready at http://localhost:${port}`))
