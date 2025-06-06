// frontend/src/api/ask.js
export async function askQuestion(question) {
  const response = await fetch('http://localhost:3001/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })

  if (!response.ok) throw new Error('AI request failed')
  const data = await response.json()
  return data.answer
}
