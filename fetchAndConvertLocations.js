// fetchAndConvertLocations.js
import fs from 'fs'
import axios from 'axios'
import dotenv from 'dotenv'
import { createObjectCsvWriter } from 'csv-writer'

dotenv.config()

const username = process.env.DATAFORSEO_LOGIN
const password = process.env.DATAFORSEO_PASSWORD

async function fetchLocations () {
  const url = 'https://api.dataforseo.com/v3/serp/google/locations'

  const response = await axios.get(url, {
    auth: { username, password }
  })

  const allLocations = response.data?.tasks?.[0]?.result || []

  const usCities = allLocations
    .filter(loc =>
      loc.country_iso_code === 'US' &&
      loc.location_type === 'City' &&
      loc.location_code &&
      loc.location_name.includes(',')
    )
    .map(loc => {
      const [city, state] = loc.location_name.split(',').map(s => s.trim())
      return {
        city,
        state,
        location_code: loc.location_code
      }
    })

  if (!usCities.length) {
    throw new Error('No US cities found — check the API response or filter conditions.')
  }

  const writer = createObjectCsvWriter({
    path: './location_lookup.csv',
    header: [
      { id: 'city', title: 'city' },
      { id: 'state', title: 'state' },
      { id: 'location_code', title: 'location_code' }
    ]
  })

  await writer.writeRecords(usCities)
  console.log(`✅ Wrote ${usCities.length} rows to location_lookup.csv`)
}

fetchLocations().catch(err => {
  console.error('❌ Failed to fetch or write locations:', err.response?.data || err.message)
})
