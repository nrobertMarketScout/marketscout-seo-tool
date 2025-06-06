import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

export async function fetchMapsResults(keyword, location) {
  const query = `${keyword} in ${location}`;
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&api_key=${SERPAPI_KEY}`;

  console.log(`📡 Calling SerpAPI URL: ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`);

  const data = await res.json();
  const results = data.local_results || [];

  console.log(`📦 Received ${results.length} result(s) for: ${query}`);

  return results.map(result => ({
    place_id: result.place_id || result.data_id || result.g_id || result.id || null,
    title: result.title || result.name || '',
    rating: result.rating || '',
    reviews_count: result.reviews || '',
    address: result.address || '',
    phone_number: result.phone || '',
    website: result.website || result.link || '',
  }));
}
