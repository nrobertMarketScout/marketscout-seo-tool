import React, { useEffect, useState } from 'react'

export default function MemoryArchive () {
  const [archive, setArchive] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('http://localhost:5001/archive')
      .then(res => res.json())
      .then(setArchive)
      .catch(err => console.error('Failed to load archive', err))
  }, [])

  const filtered = archive.filter(entry =>
    entry.question.toLowerCase().includes(filter.toLowerCase()) ||
    entry.response.toLowerCase().includes(filter.toLowerCase())
  )

  const download = () => {
    if (!selected) return
    const blob = new Blob([
      `Q: ${selected.question}\n\nA: ${selected.response}`
    ], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.timestamp || 'archive'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧠 Memory Archive</h1>
        <a href="/matrix" className="text-blue-600 hover:underline">📊 Back to Matrix</a>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Filter memories..."
          className="border p-2 rounded flex-grow"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-3 space-y-2 overflow-y-auto max-h-[75vh]">
          {filtered.map((entry, i) => (
            <button
              key={i}
              onClick={() => setSelected(entry)}
              className={`w-full text-left p-2 rounded hover:bg-blue-50 ${selected === entry ? 'bg-blue-100' : ''}`}
            >
              <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
              <p className="truncate">{entry.question}</p>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 border p-4 rounded">
          {selected ? (
            <>
              <p className="text-sm text-gray-500">{new Date(selected.timestamp).toLocaleString()}</p>
              <h2 className="text-lg font-semibold mb-2">{selected.question}</h2>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded max-h-[60vh] overflow-auto">{selected.response}</pre>
              <button
                onClick={download}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ⬇️ Export
              </button>
            </>
          ) : (
            <p className="text-gray-400 italic">Select an entry to view it</p>
          )}
        </div>
      </div>
    </div>
  )
}
