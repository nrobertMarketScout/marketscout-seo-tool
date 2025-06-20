// backend/api/locations.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const curatedCsvPath = path.resolve(__dirname, '../US_City_Population_Data__Cleaned_.csv')
const lookupCsvPath = path.resolve(__dirname, '../location_lookup.csv')

let cachedStates = []
let cachedCities = []
let locationCodeMap = new Map()

function loadLocationCodes () {
  return new Promise((resolve, reject) => {
    const map = new Map()
    fs.createReadStream(lookupCsvPath)
      .pipe(csv())
      .on('data', row => {
        const city = row.city?.trim().toLowerCase()
        const state = row.state?.trim().toLowerCase()
        const key = `${city},${state}`
        if (row.location_code) {
          map.set(key, row.location_code)
        }
      })
      .on('end', () => {
        locationCodeMap = map
        console.log(`✅ Loaded ${map.size} location code entries from DataForSEO lookup`)
        resolve()
      })
      .on('error', reject)
  })
}

function loadCuratedCities () {
  return new Promise((resolve, reject) => {
    const statesSet = new Set()
    const cities = []

    fs.createReadStream(curatedCsvPath)
      .pipe(csv())
      .on('data', row => {
        const city = row['City/Town/CDP']?.trim()
        const state = row['State']?.trim()
        if (city && state) {
          const key = `${city.toLowerCase()},${state.toLowerCase()}`
          const locationCode = locationCodeMap.get(key) || null
          statesSet.add(state)
          cities.push({ city, state, locationCode })
        }
      })
      .on('end', () => {
        cachedStates = [...statesSet].sort()
        cachedCities = cities
        console.log(`✅ Loaded ${cities.length} valid US locations from population file`)
        resolve()
      })
      .on('error', reject)
  })
}

export default async function handler (req, res) {
  try {
    if (!cachedCities.length || !locationCodeMap.size) {
      await loadLocationCodes()
      await loadCuratedCities()
    }

    const { states: filterStates, resolve } = req.query

    // Resolve API: ?resolve=City,ST
    if (resolve) {
      const [rawCity, rawState] = resolve.split(',').map(s => s.trim())
      const key = `${rawCity.toLowerCase()},${rawState.toLowerCase()}`
      const locationCode = locationCodeMap.get(key)
      if (locationCode) {
        return res.status(200).json({ locationCode })
      } else {
        return res.status(404).json({ error: `No match found for: ${resolve}` })
      }
    }

    // Standard load (optionally filter cities)
    if (filterStates) {
      const requested = filterStates.split(',').map(s => s.trim().toLowerCase())
      const filteredCities = cachedCities.filter(c => requested.includes(c.state.toLowerCase()))
      return res.status(200).json({ cities: filteredCities })
    }

    return res.status(200).json({
      states: cachedStates,
      cities: cachedCities
    })
  } catch (err) {
    console.error('❌ Failed in locations handler:', err)
    res.status(500).json({ error: 'Internal location handler error' })
  }
}
