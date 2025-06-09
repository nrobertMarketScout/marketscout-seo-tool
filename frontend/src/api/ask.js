// frontend/src/api/ask.js
export async function askQuestion(question) {
  const response = await fetch('http://localhost:3001/api/bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  if (!response.ok) throw new Error('AI request failed');
  const data = await response.json();

  // If structured format is present
  if (data.summary && data.location && Array.isArray(data.niches)) {
    return {
      type: 'structured',
      summary: data.summary,
      location: data.location,
      niches: data.niches,
      csv: data.csv || null
    };
  }

  // If fallback response with plain text
  if (typeof data.text === 'string') {
    return { type: 'text', text: data.text };
  }

  // Fallback for answer (older API behavior)
  if (typeof data.answer === 'string') {
    return { type: 'text', text: data.answer };
  }

  // Final fallback
  return { type: 'text', text: 'No answer returned.' };
}
