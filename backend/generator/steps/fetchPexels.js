import axios from 'axios';

/**
 * Return three landscape photos from Pexels that match the given search term.
 * Requires PEXELS_API_KEY in ../.env
 */
export default async function fetchPexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY missing in .env');

  const { data } = await axios.get('https://api.pexels.com/v1/search', {
    headers: { Authorization: key },
    params : { query, per_page: 30, orientation: 'landscape' }
  });

  const picks = (data.photos || []).sort(() => 0.5 - Math.random()).slice(0, 3);
  // fallback clause: if Pexels returns fewer than 3, repeat the first
  while (picks.length < 3) picks.push(picks[0]);

  return picks.map(p => p.src.large);
}
