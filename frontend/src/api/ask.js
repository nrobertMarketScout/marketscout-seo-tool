// frontend/src/api/ask.js
export async function askQuestion(question) {
  const response = await fetch('http://localhost:3001/api/bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  if (!response.ok) throw new Error('AI request failed');
  const data = await response.json();

  // Structured format (scrape trigger flow)
  if (data.summary && data.location && Array.isArray(data.niches)) {
    // Save memory (structured)
    try {
      await fetch('http://localhost:3001/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'structured',
          question,
          summary: data.summary,
          location: data.location,
          niches: data.niches,
          csv: data.csv || ''
        })
      });
    } catch (err) {
      console.warn('🧠 Memory save failed:', err.message);
    }

    return {
      type: 'structured',
      summary: data.summary,
      location: data.location,
      niches: data.niches,
      csv: data.csv || null
    };
  }

  // Fallback response with plain text
  if (typeof data.text === 'string') {
    try {
      await fetch('http://localhost:3001/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          question,
          text: data.text,
          tags: data.tags || [],
          source: data.source || ''
        })
      });
    } catch (err) {
      console.warn('🧠 Memory save failed:', err.message);
    }

    return { type: 'text', text: data.text, tags: data.tags || [], source: data.source || '' };
  }

  // Legacy fallback
  if (typeof data.answer === 'string') {
    return { type: 'text', text: data.answer };
  }

  return { type: 'text', text: 'No answer returned.' };
}
