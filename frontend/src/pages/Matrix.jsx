// frontend/pages/Matrix.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

export default function Matrix () {
  const [rows, setRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [filters, setFilters] = useState({
    minScore: '', maxScore: '',
    minVolume: '', maxVolume: '',
    minCPC: '', maxCPC: '',
    mapPack: ''
  })

  const handleLoad = async () => {
    setError(null)
    const keywords = keywordInput.split(',').map(k => k.trim()).filter(Boolean)
    const locationCode = locationInput.trim()

    if (!keywords.length || !locationCode) {
      setError('Please enter keywords and location code.')
      return
    }

    const payload = { keywords, locationCode }
    console.log('[Submitting payload]', payload)

    try {
      setLoading(true)
      const res = await axios.post('/api/matrix', payload)
      setRows(res.data.matrix || [])
      setFilteredRows(res.data.matrix || [])
    } catch (err) {
      console.error('[Matrix Load Error]', err)
      setError(`Request failed: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    const f = filters
    const result = rows.filter(row => {
      const scoreMatch =
        (!f.minScore || row.score >= Number(f.minScore)) &&
        (!f.maxScore || row.score <= Number(f.maxScore))
      const volumeMatch =
        (!f.minVolume || row.volume >= Number(f.minVolume)) &&
        (!f.maxVolume || row.volume <= Number(f.maxVolume))
      const cpcMatch =
        (!f.minCPC || row.cpc >= Number(f.minCPC)) &&
        (!f.maxCPC || row.cpc <= Number(f.maxCPC))
      const mapPackMatch =
        f.mapPack === ''
          ? true
          : f.mapPack === 'yes'
            ? row.hasMapPack === true
            : row.hasMapPack === false
      return scoreMatch && volumeMatch && cpcMatch && mapPackMatch
    })
    setFilteredRows(result)
  }

  useEffect(() => {
    applyFilters()
  }, [filters, rows])

  const toggleExpand = idx => {
    const next = new Set(expanded)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setExpanded(next)
  }

  const downloadCSV = () => {
    const header = Object.keys(rows[0] || {}).join(',')
    const body = rows.map(row => Object.values(row).join(',')).join('\n')
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'matrix.csv'
    a.click()
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'matrix.json'
    a.click()
  }

  const Row = ({ index, style }) => {
    const row = filteredRows[index]
    const isExpanded = expanded.has(index)
    const breakdown = isExpanded ? row.score_breakdown : row.score_breakdown?.slice(0, 2)

    return (
      <div style={{ ...style, display: 'flex' }} className="border-t border-gray-200 hover:bg-gray-50 text-sm">
        <div className="p-2 w-1/6">{row.keyword}</div>
        <div className="p-2 w-1/6">{row.location}</div>
        <div className="p-2 w-1/12">{row.volume}</div>
        <div className="p-2 w-1/12">${row.cpc}</div>
        <div className="p-2 w-1/12">{row.competition}</div>
        <div className="p-2 w-1/12">{row.score}</div>
        <div className="p-2 w-1/12">
          <span
            data-tooltip-id={`tooltip-${index}`}
            data-tooltip-content={
              row.hasMapPack
                ? `Map Pack: ${row.mapPackOverlap} overlapping\nWeak listings: ${row.mapPackWeak}`
                : 'No Map Pack present'
            }
            className={`px-2 py-1 rounded-full text-xs font-semibold ${row.hasMapPack
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-200 text-gray-600'}`}
          >
            {row.hasMapPack ? 'Overlap' : 'None'}
          </span>
          <Tooltip id={`tooltip-${index}`} />
        </div>
        <div className="p-2 w-1/3 text-xs whitespace-pre-line text-gray-600">
          {breakdown?.map((line, i) => <div key={i}>• {line}</div>)}
          {row.score_breakdown?.length > 2 && (
            <div className="text-blue-500 cursor-pointer" onClick={() => toggleExpand(index)}>
              [{isExpanded ? '-' : '+'}] {isExpanded ? 'Hide' : 'See more'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Opportunity Matrix</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={downloadCSV} className="bg-blue-500 text-white px-3 py-1 rounded">Export CSV</button>
        <button onClick={downloadJSON} className="bg-green-500 text-white px-3 py-1 rounded">Export JSON</button>
        <button onClick={handleLoad} className="bg-black text-white px-3 py-1 rounded">Load</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <input type="text" placeholder="Keyword(s)" className="border p-2" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} />
        <input type="text" placeholder="Location Code" className="border p-2" value={locationInput} onChange={e => setLocationInput(e.target.value)} />
        <input type="number" placeholder="Min Score" className="border p-2" value={filters.minScore} onChange={e => setFilters({ ...filters, minScore: e.target.value })} />
        <input type="number" placeholder="Max Score" className="border p-2" value={filters.maxScore} onChange={e => setFilters({ ...filters, maxScore: e.target.value })} />
        <input type="number" placeholder="Min Volume" className="border p-2" value={filters.minVolume} onChange={e => setFilters({ ...filters, minVolume: e.target.value })} />
        <input type="number" placeholder="Max Volume" className="border p-2" value={filters.maxVolume} onChange={e => setFilters({ ...filters, maxVolume: e.target.value })} />
        <input type="number" placeholder="Min CPC" className="border p-2" value={filters.minCPC} onChange={e => setFilters({ ...filters, minCPC: e.target.value })} />
        <input type="number" placeholder="Max CPC" className="border p-2" value={filters.maxCPC} onChange={e => setFilters({ ...filters, maxCPC: e.target.value })} />
        <select className="border p-2" value={filters.mapPack} onChange={e => setFilters({ ...filters, mapPack: e.target.value })}>
          <option value="">Map Pack</option>
          <option value="yes">✅</option>
          <option value="no">❌</option>
        </select>
      </div>

      {error && <div className="text-red-500 p-2">{error}</div>}

      <div className="border border-gray-300">
        <div className="flex bg-gray-100 sticky top-0 z-10 text-sm font-semibold">
          <div className="p-2 w-1/6">Keyword</div>
          <div className="p-2 w-1/6">Location</div>
          <div className="p-2 w-1/12">Volume</div>
          <div className="p-2 w-1/12">Cpc</div>
          <div className="p-2 w-1/12">Competition</div>
          <div className="p-2 w-1/12">Score</div>
          <div className="p-2 w-1/12">Map Pack</div>
          <div className="p-2 w-1/3">Breakdown</div>
        </div>
        <div style={{ height: '600px' }}>
          <AutoSizer>
            {({ width, height }) => (
              <List
                height={height}
                itemCount={filteredRows.length}
                itemSize={90}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  )
}
