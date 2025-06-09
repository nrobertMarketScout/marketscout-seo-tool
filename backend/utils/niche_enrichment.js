// backend/utils/niche_enrichment.js
import fs from 'fs/promises';
import Papa from 'papaparse';
import path from 'path';
import { fetchMapsResults } from '../lib/serpapi_client.js';
import { auditAndScore } from '../lib/audit_and_score.js';

const SERVICE_CSV = path.join(process.cwd(), 'services_list.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'enriched_niches_output.csv');

export async function parseLocationAndNiches(text) {
  const locationMatch = text.match(/in\s+([A-Za-z\s]+(?:,?\s*(OR|WA|CA|TX|NY)))/i);
  const location = locationMatch ? locationMatch[1].trim() : null;
  if (!location) return { location: null, niches: [] };

  const file = await fs.readFile(SERVICE_CSV, 'utf8');
  const { data } = Papa.parse(file, { header: false });
  const known = data.map((r) => r[0]?.toLowerCase()).filter(Boolean);

  const niches = known.filter((n) => text.toLowerCase().includes(n));
  return { location, niches };
}

export async function runBulkOpportunityScan(location, servicesInput) {
  const services = Array.isArray(servicesInput) ? servicesInput : [];
  const allResults = [];

  for (const keyword of services) {
    const results = await fetchMapsResults(keyword, location);
    const seen = new Set();

    for (const res of results) {
      const key = res.place_id;
      if (key && !seen.has(key)) {
        seen.add(key);
        allResults.push({
          Keyword: keyword,
          Location: location,
          Name: res.title || res.name || '',
          Rating: res.rating || '',
          Reviews: res.rating_total || res.reviews_count || '',
          Address: res.address || '',
          Phone: res.phone_number || '',
          PlaceId: res.place_id,
          Website: res.website || '',
          Latitude: res.gps_coordinates?.latitude ?? res.geometry?.location?.lat ?? '',
          Longitude: res.gps_coordinates?.longitude ?? res.geometry?.location?.lng ?? ''
        });
      }
    }
  }

  const scored = auditAndScore(allResults);
  const scoreMap = {};
  for (const row of scored) {
    const key = `${row.Keyword}::${row.Location}`;
    scoreMap[key] = row.OpportunityScore;
  }

  const finalResults = allResults.map((entry) => {
    const key = `${entry.Keyword}::${entry.Location}`;
    return {
      ...entry,
      OpportunityScore: scoreMap[key] || 0
    };
  });

  await fs.writeFile(OUTPUT_CSV, Papa.unparse(finalResults, { quotes: true }));

  const grouped = {};
  for (const row of finalResults) {
    const key = `${row.Keyword}::${row.Location}`;
    if (!grouped[key]) {
      grouped[key] = { keyword: row.Keyword, location: row.Location, scores: [] };
    }
    grouped[key].scores.push(row.OpportunityScore);
  }

  const summary = Object.values(grouped)
    .map(({ keyword, location, scores }) => ({
      keyword,
      location,
      avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  return { summary, csvPath: OUTPUT_CSV };
}
