// src/pages/Scraper.jsx
import React, { useState } from 'react'
import { runScrape } from '../api/run'

const Scraper = () => {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setStatus('')
  }

  const handleSubmit = async () => {
    if (!file) {
      setStatus('❌ Please select a CSV file.')
      return
    }

    setIsLoading(true)
    setStatus('⏳ Uploading and starting scrape...')

    try {
      const response = await runScrape(file)
      setStatus(`✅ Scrape complete. ${response.message || 'Results generated.'}`)
    } catch (err) {
      console.error('Scrape failed:', err)
      setStatus(`❌ Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🗂️ Upload Input CSV</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
      >
        {isLoading ? 'Running...' : 'Start Scrape'}
      </button>

      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  )
}

export default Scraper
