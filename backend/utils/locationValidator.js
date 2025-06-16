// backend/utils/locationValidator.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cityCsvPath = path.resolve(__dirname, '../US_City_Population_Data__Cleaned_.csv')

const validLocations = new Set()

export function loadValidLocations () {
  return new Promise((resolve, reject) => {
    fs.createReadStream(cityCsvPath)
      .pipe(csv())
      .on('data', (row) => {
        const state = row['State']?.trim()
        const city = row['City/Town/CDP']?.trim()
        if (city && state) {
          const key = `${city.toLowerCase()},${state.toLowerCase()}`
          validLocations.add(key)
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${validLocations.size} valid US locations from population file`)
        resolve()
      })
      .on('error', (err) => {
        console.error('❌ Failed to load city list:', err.message)
        reject(err)
      })
  })
}

export function isValidLocation (loc = '') {
  const cleaned = normalizeLocation(loc)
  return validLocations.has(cleaned)
}

export function normalizeLocation (loc = '') {
  const match = loc.trim().match(/^([\w\s\-]+),?\s*([A-Z]{2})$/i)
  if (!match) return ''
  const [, city, state] = match
  return `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`
}
