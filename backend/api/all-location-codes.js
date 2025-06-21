import fs from 'fs'
import path from 'path'
import express from 'express'
const router = express.Router()

const locationCSV = path.join(process.cwd(), 'location_lookup.csv')

let allLocations = []

// Load the full location list once at startup
function loadAllLocations () {
  const data = fs.readFileSync(locationCSV, 'utf8')
  allLocations = data
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [city, state, code] = line.split(',')
      return {
        city: city.trim(),
        state: state.trim(),
        location_code: Number(code)
      }
    })
  console.log(`📍 Loaded ${allLocations.length} total location code entries`)
}

loadAllLocations()

router.get('/', (req, res) => {
  res.json({ locations: allLocations })
})

export default router
