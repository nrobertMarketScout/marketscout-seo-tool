// backend/api/matrix.js
import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

router.get('/', async (req, res) => {
  try {
    const matrixPath = path.resolve(__dirname, '../../data/combined_opportunity_matrix.csv')
    const csv = await fs.readFile(matrixPath, 'utf-8')
    const { data } = Papa.parse(csv, { header: true })
    res.json({ matrix: data })
  } catch (err) {
    console.error('❌ Failed to load matrix.csv:', err)
    res.status(500).json({ error: 'Failed to load matrix data' })
  }
})

export default router
