// src/api/run.js
export async function runScrape(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('http://localhost:3001/api/run', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    throw new Error(`Failed to start scrape: ${res.statusText}`)
  }

  return await res.json()
}
