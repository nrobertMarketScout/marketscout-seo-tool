import axios from 'axios';

export default async function fetchUnsplash(city, niche) {
  const term = `${niche} ${city}`;
  const qs   = encodeURIComponent(term);
  const url  = `https://source.unsplash.com/featured/800x600/?${qs}`;

  // Unsplash “Source” returns a 302 → final image. Grab 3 unique urls.
  const shots = new Set();
  while (shots.size < 3) {
    const { request } = await axios.get(url, { maxRedirects: 0 }).catch(r => r);
    if (request?.res?.responseUrl) shots.add(request.res.responseUrl);
  }
  return [...shots];
}
