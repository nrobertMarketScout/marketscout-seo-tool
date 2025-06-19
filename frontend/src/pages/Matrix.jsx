import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { FixedSizeList as List } from 'react-window'

export default function Matrix () {
  const [rows, setRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [expandedRows, setExpandedRows] = useState(new Set())
  const fetchedOnce = useRef(false)

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    minScore: '',
    maxScore: '',
    mapPack: '',
    minVolume: '',
    maxVolume: '',
    minCPC: '',
    maxCPC: ''
  })

  useEffect(() => {
    if (fetchedOnce.current) return
    fetchedOnce.current = true

    const fetchMatrix = async () => {
      try {
        const res = await axios.get('/api/matrix')
        setRows(res.data.matrix || [])
        setFilteredRows(res.data.matrix || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatrix()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, rows])

  const applyFilters = () => {
    const f = filters
    const result = rows.filter(row => {
      const keywordMatch = row.keyword.toLowerCase().includes(f.keyword.toLowerCase())
      const locationMatch = row.location.toLowerCase().includes(f.location.toLowerCase())
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

      return keywordMatch && locationMatch && scoreMatch && volumeMatch && cpcMatch && mapPackMatch
    })

    const sorted = [...result]
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const valA = a[sortConfig.key]
        const valB = b[sortConfig.key]
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredRows(sorted)
  }

  const requestSort = key => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const toggleRow = index => {
    const updated = new Set(expandedRows)
    if (updated.has(index)) updated.delete(index)
    else updated.add(index)
    setExpandedRows(updated)
  }

  const downloadCSV = () => {
    const header = Object.keys(rows[0] || {}).join(',')
    const body = rows.map(row =>
      Object.values({
        ...row,
        score_breakdown: JSON.stringify(row.score_breakdown || [])
      }).join(',')
    ).join('\n')

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

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Opportunity Matrix</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={downloadCSV} className="bg-blue-500 text-white px-3 py-1 rounded">Export CSV</button>
        <button onClick={downloadJSON} className="bg-green-500 text-white px-3 py-1 rounded">Export JSON</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <input type="text" placeholder="Keyword" className="border p-2" value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
        <input type="text" placeholder="Location" className="border p-2" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })} />
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

      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 bg-gray-100 font-bold border border-gray-300 sticky top-0 z-10 text-sm">
          <div className="p-2">Keyword</div>
          <div className="p-2">Location</div>
          <div className="p-2">Volume</div>
          <div className="p-2">Cpc</div>
          <div className="p-2">Competition</div>
          <div className="p-2">Score</div>
          <div className="p-2">Map Pack</div>
          <div className="p-2">Breakdown</div>
        </div>

        <div style={{ height: 500 }} className="overflow-auto border border-t-0 border-gray-300">
          <List
            height={500}
            itemCount={filteredRows.length}
            itemSize={110}
            width="100%"
          >
            {({ index, style }) => {
              const row = filteredRows[index]
              return (
                <div
                  key={index}
                  className="grid grid-cols-8 border-t border-gray-200 text-sm items-start"
                  style={style}
                >
                  <div className="p-2">{row.keyword}</div>
                  <div className="p-2">{row.location}</div>
                  <div className="p-2">{row.volume}</div>
                  <div className="p-2">${row.cpc}</div>
                  <div className="p-2">{row.competition}</div>
                  <div className="p-2">{row.score}</div>
                  <div className="p-2">{row.hasMapPack ? '✅' : '❌'}</div>
                  <div className="p-2">
                    {row.score_breakdown ? (
                      <>
                        {(expandedRows.has(index)
                          ? row.score_breakdown
                          : row.score_breakdown.slice(0, 2)
                        ).map((line, i) => (
                          <div key={i}>• {line}</div>
                        ))}
                        {row.score_breakdown.length > 2 && (
                          <div
                            onClick={() => toggleRow(index)}
                            className="text-blue-500 cursor-pointer text-xs mt-1 inline-block"
                          >
                            {expandedRows.has(index) ? '[−] See less' : '[+] See more'}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )
            }}
          </List>
        </div>
      </div>
    </div>
  )
}
