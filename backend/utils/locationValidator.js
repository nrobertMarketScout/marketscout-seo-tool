// backend/utils/locationValidator.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const curatedCityPath = path.resolve(__dirname, '../US_City_Population_Data__Cleaned_.csv')
const lookupPath = path.resolve(__dirname, '../location_lookup.csv')

const validLocations = new Set()
const locationCodeMap = new Map()

export function normalizeLocation (loc = '') {
  const match = loc.trim().match(/^([\w\s\.\-']+),\s*([A-Z]{2})$/i)
  if (!match) return ''
  const [, city, state] = match
  return `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`
}

export function isValidLocation (loc = '') {
  const cleaned = normalizeLocation(loc)
  return validLocations.has(cleaned)
}

export async function loadValidLocations () {
  return new Promise((resolve, reject) => {
    let pending = 2

    const checkDone = () => {
      pending--
      if (pending === 0) {
        console.log(`✅ Loaded ${validLocations.size} valid US locations from population file`)
        console.log(`✅ Loaded ${locationCodeMap.size} location code entries from DataForSEO lookup`)
        resolve()
      }
    }

    // Load curated filter list
    fs.createReadStream(curatedCityPath)
      .pipe(csv())
      .on('data', (row) => {
        const city = row['City/Town/CDP']?.trim()
        const state = row['State']?.trim()
        if (city && state) {
          const key = normalizeLocation(`${city}, ${state}`)
          validLocations.add(key)
        }
      })
      .on('end', checkDone)
      .on('error', reject)

    // Load location code lookup
    fs.createReadStream(lookupPath)
      .pipe(csv())
      .on('data', (row) => {
        const city = row['city']?.trim()
        const state = row['state']?.trim()
        const code = row['location_code']?.trim()
        if (city && state && code) {
          const key = normalizeLocation(`${city}, ${state}`)
          locationCodeMap.set(key, code)
        }
      })
      .on('end', checkDone)
      .on('error', reject)
  })
}

export function getLocationCode (city, state) {
  const key = normalizeLocation(`${city}, ${state}`)
  return locationCodeMap.get(key) || null
}
