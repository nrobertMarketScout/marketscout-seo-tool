// backend/api/bot.js
const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { Configuration, OpenAIApi } = require('openai')
const { getRelevantChunks } = require('../utils/embeddings')
const { querySerpAPI } = require('../utils/serpapi')

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
)

router.post('/', async (req, res) => {
  const question = req.body.question
  if (!question) return res.status(400).json({ error: 'Missing question' })

  try {
    const chunks = await getRelevantChunks(question)

    let answer = ''
    if (chunks.length > 0) {
      const context = chunks.join('\n---\n').slice(0, 12000) // token safety
      const response = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful Rank & Rent Expert.' },
          {
            role: 'user',
            content: `Using the following context:\n${context}\n\nAnswer: ${question}`
          }
        ],
        temperature: 0.4
      })
      answer = response.data.choices[0].message.content
    } else {
      const fallback = await querySerpAPI(question)
      answer = `Transcript match not found. Here’s what I found online:\n\n${fallback}`
    }

    res.json({ answer, chunks })
  } catch (err) {
    console.error('❌ Bot error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
