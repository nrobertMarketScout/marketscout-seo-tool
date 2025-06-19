import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Matrix () {
  const [rows, setRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
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

      <table className="w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-left cursor-pointer">
            {['keyword', 'location', 'volume', 'cpc', 'competition', 'score'].map(field => (
              <th key={field} className="p-2" onClick={() => requestSort(field)}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortConfig.key === field ? (sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽') : ''}
              </th>
            ))}
            <th className="p-2">Map Pack</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, idx) => (
            <tr key={idx} className="border-t border-gray-200">
              <td className="p-2">{row.keyword}</td>
              <td className="p-2">{row.location}</td>
              <td className="p-2">{row.volume}</td>
              <td className="p-2">${row.cpc}</td>
              <td className="p-2">{row.competition}</td>
              <td className="p-2">{row.score}</td>
              <td className="p-2">{row.hasMapPack ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
