export async function buildSiteBundle(payload) {
  const res = await fetch('/api/site/bundle', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(payload)
  });
  return res.json();
}
