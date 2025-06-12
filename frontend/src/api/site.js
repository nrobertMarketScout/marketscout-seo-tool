// frontend/src/api/site.js
export async function buildSiteBundle(payload) {
  const r = await fetch('/api/site/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return r.json();
}
