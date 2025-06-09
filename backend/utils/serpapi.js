// backend/utils/serpapi.js
import fetch from 'node-fetch';

const SERP_API_KEY = process.env.SERPAPI_API_KEY;

export async function querySerpAPI(query) {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_maps&api_key=${SERP_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('SerpAPI fetch failed');
  const data = await res.json();

  const results = (data?.local_results || []).map(biz => ({
    name: biz.title,
    address: biz.address,
    phone: biz.phone,
    website: biz.website,
    rating: biz.rating,
    reviews: biz.reviews,
    type: biz.type,
    latitude: biz.gps_coordinates?.latitude,
    longitude: biz.gps_coordinates?.longitude,
  }));

  return results.length
    ? results.map(b => `- ${b.name}, ${b.address || 'no address'}, ${b.rating || 'no rating'} (${b.reviews || 0} reviews)`)
      .join('\n')
    : 'No local results found.';
}
