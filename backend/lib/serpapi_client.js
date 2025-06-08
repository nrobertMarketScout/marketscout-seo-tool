// backend/lib/serpapi_client.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = {};

export async function fetchMapsResults(keyword, location) {
  const query = `${keyword} in ${location}`;
  const url = `https://serpapi.com/search.json?engine=google_maps&type=search&q=${encodeURIComponent(
    query
  )}&api_key=${SERPAPI_KEY}`;

  try {
    const response = await axios.get(url);
    const rawResults = response.data?.local_results || [];

    const enriched = [];

    for (const result of rawResults) {
      const placeId = result.place_id;
      if (!placeId) continue;

      let details = {
        name: result.title || '',
        address: result.address || '',
        phone_number: result.phone || '',
        rating: result.rating || '',
        reviews_count: result.reviews || '',
        website: result.website || ''
      };

      // Check if enrichment is needed
      const missingData = !details.address || !details.phone_number || !details.reviews_count;

      // Only enrich if we have no review data or critical info
      if (missingData && !cache[placeId]) {
        try {
          const fallbackUrl = `https://serpapi.com/search.json?engine=google_maps&place_id=${placeId}&api_key=${SERPAPI_KEY}`;
          const fallbackRes = await axios.get(fallbackUrl);
          const place = fallbackRes.data?.place_result;

          if (place) {
            details = {
              name: place.title || details.name,
              address: place.address || details.address,
              phone_number: place.phone || details.phone_number,
              rating: place.rating || details.rating,
              reviews_count: place.reviews || details.reviews_count,
              website: place.website || details.website
            };

            cache[placeId] = details;
            await sleep(250);
          }
        } catch (err) {
          console.warn(`⚠️ SerpAPI fallback failed for ${placeId}:`, err.message);
        }
      } else if (cache[placeId]) {
        details = cache[placeId];
      }

      enriched.push({
        ...result,
        ...details,
        gps_coordinates: result.gps_coordinates
      });
    }

    return enriched;
  } catch (err) {
    console.error('❌ SerpAPI fetch failed:', err.message);
    return [];
  }
}
