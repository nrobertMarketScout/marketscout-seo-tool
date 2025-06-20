// backend/api/services.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.resolve(__dirname, '../services_list.csv')

export default async function handler (req, res) {
  try {
    const services = []

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const service = row['Service']?.trim()
        if (service) services.push(service)
      })
      .on('end', () => {
        services.sort((a, b) => a.localeCompare(b))
        res.status(200).json({ services })
      })
      .on('error', (err) => {
        console.error('❌ Failed to load services:', err)
        res.status(500).json({ error: 'Failed to load services' })
      })
  } catch (err) {
    console.error('❌ Unexpected error loading services:', err)
    res.status(500).json({ error: 'Internal error' })
  }
}
