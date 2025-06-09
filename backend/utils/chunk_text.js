// /backend/utils/chunk_text.js
import { encoding_for_model } from 'tiktoken'

const encoder = encoding_for_model('gpt-4')
const MAX_TOKENS = 800  // keeps chunks safely within model limits

/**
 * Splits a string of text into token-bound chunks for embedding.
 * @param {string} text
 * @returns {string[]}
 */
export function chunkText(text) {
  const words = text.split(/\s+/)
  const chunks = []
  let chunk = ''

  for (let word of words) {
    const testChunk = chunk.length > 0 ? `${chunk} ${word}` : word
    const tokens = encoder.encode(testChunk)

    if (tokens.length > MAX_TOKENS) {
      if (chunk.length > 0) {
        chunks.push(chunk)
        chunk = word
      } else {
        // single word too long, truncate
        chunks.push(word.slice(0, 1000))
        chunk = ''
      }
    } else {
      chunk = testChunk
    }
  }

  if (chunk.length > 0) {
    chunks.push(chunk)
  }

  return chunks
}
