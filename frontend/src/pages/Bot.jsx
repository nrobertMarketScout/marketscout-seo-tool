// frontend/src/pages/Bot.jsx
import React, { useState } from 'react'
import Layout from '../components/Layout'

export default function Bot() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [chunks, setChunks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const askQuestion = async e => {
    e.preventDefault()
    setLoading(true)
    setAnswer('')
    setChunks([])
    setError('')

    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      if (data.answer) setAnswer(data.answer)
      if (data.chunks) setChunks(data.chunks)
      if (!response.ok) throw new Error(data.error || 'Unknown error')
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title='Ask the Rank & Rent Expert'>
      <form onSubmit={askQuestion} className='mb-6 space-y-4'>
        <textarea
          className='w-full p-3 border rounded resize-none'
          rows={4}
          placeholder='Ask a question about rank & rent, SOPs, outreach, content, etc...'
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <button
          type='submit'
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
          disabled={loading || !question}
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {error && <div className='text-red-600 mb-4'>{error}</div>}

      {answer && (
        <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded shadow-sm'>
          <h2 className='font-semibold text-green-800 mb-2'>Answer</h2>
          <p>{answer}</p>
        </div>
      )}

      {chunks.length > 0 && (
        <div className='mt-6'>
          <h3 className='text-lg font-semibold mb-2'>Supporting Evidence:</h3>
          <ul className='list-disc list-inside space-y-2'>
            {chunks.map((chunk, idx) => (
              <li key={idx} className='text-gray-700'>
                <span className='font-mono text-sm'>{chunk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  )
}
