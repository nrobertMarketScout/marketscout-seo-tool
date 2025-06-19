// backend/utils/locationCodes.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const locationDataPath = path.resolve(__dirname, '../data/locations-dataforseo.json')

let locations = []

try {
  const raw = fs.readFileSync(locationDataPath, 'utf-8')
  locations = JSON.parse(raw)
} catch (err) {
  console.error('❌ Failed to load location codes:', err.message)
}

// Match just the city part from location_name
export function getLocationCodeByName(name) {
  const input = name.trim().toLowerCase()

  const match = locations.find(loc => {
    const city = loc.location_name?.split(',')[0]?.trim().toLowerCase()
    return city === input
  })

  if (!match) {
    console.warn(`⚠️ No location_code found for: "${name}"`)
    return null
  }

  return match.location_code
}
