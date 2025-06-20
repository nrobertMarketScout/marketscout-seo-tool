// frontend/components/Matrix.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Select from 'react-select'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

export default function Matrix () {
  const [rows, setRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    minScore: '', maxScore: '',
    minVolume: '', maxVolume: '',
    minCPC: '', maxCPC: '',
    mapPackStatus: ''
  })

  const [allStates, setAllStates] = useState([])
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [selectedStates, setSelectedStates] = useState([])
  const [selectedCities, setSelectedCities] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)

  const [keywordInput, setKeywordInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  useEffect(() => {
    async function fetchOptions () {
      try {
        const locRes = await axios.get('/api/locations')
        const svcRes = await axios.get('/api/services')

        const states = locRes.data.states.map(state => ({ label: state, value: state }))
        const cities = locRes.data.cities.map(city => ({
          label: `${city.city}, ${city.state}`,
          value: `${city.city},${city.state}`,
          locationCode: city.location_code,
          state: city.state
        }))
        const services = svcRes.data.services.map(svc => ({ label: svc, value: svc }))

        setAllStates(states)
        setAllCities(cities)
        setFilteredCities(cities)
        setServicesList(services)
      } catch (err) {
        console.error('❌ Failed to load picklists:', err)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (!selectedStates.length) {
      setFilteredCities(allCities)
    } else {
      const selectedStateValues = selectedStates.map(s => s.value)
      setFilteredCities(allCities.filter(city => selectedStateValues.includes(city.state)))
    }
  }, [selectedStates, allCities])

  const handleLoad = async () => {
    setError(null)

    const keywords = selectedServices.map(s => s.value)

    // use location codes from city picklist
    const picklistLocationCodes = selectedCities
      .map(c => c.locationCode)
      .filter(Boolean)

    let payload = {}

    if (keywords.length && picklistLocationCodes.length) {
      payload = { keywords, locationCodes: picklistLocationCodes }
    } else if (keywordInput && locationInput) {
      try {
        const res = await axios.get(`/api/locations?resolve=${encodeURIComponent(locationInput.trim())}`)
        const resolvedCode = res.data.locationCode
        if (!resolvedCode) {
          setError('Could not resolve location input to a valid location code.')
          return
        }
        payload = {
          keywords: keywordInput.split(',').map(k => k.trim()).filter(Boolean),
          locationCodes: [resolvedCode]
        }
      } catch (err) {
        console.error('[Location Resolution Error]', err)
        setError('Location lookup failed — check formatting or spelling (e.g. Denver, CO).')
        return
      }
    } else {
      setError('Please enter keywords and location(s).')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post('/api/matrix', payload)
      setRows(res.data.matrix || [])
    } catch (err) {
      console.error('[Matrix Load Error]', err)
      setError(`Request failed: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...rows]
    const f = filters

    result = result.filter(row => {
      const scoreMatch =
        (!f.minScore || row.score >= Number(f.minScore)) &&
        (!f.maxScore || row.score <= Number(f.maxScore))
      const volumeMatch =
        (!f.minVolume || row.volume >= Number(f.minVolume)) &&
        (!f.maxVolume || row.volume <= Number(f.maxVolume))
      const cpcMatch =
        (!f.minCPC || row.cpc >= Number(f.minCPC)) &&
        (!f.maxCPC || row.cpc <= Number(f.maxCPC))

      const mapStatus = !row.hasMapPack
        ? 'none'
        : row.mapPackOverlap > 1 && row.mapPackWeak === 0
          ? 'strong'
          : 'weak'

      const mapPackMatch = f.mapPackStatus === '' || f.mapPackStatus === mapStatus
      return scoreMatch && volumeMatch && cpcMatch && mapPackMatch
    })

    if (sortConfig.key) {
      result.sort((a, b) => {
        const dir = sortConfig.direction === 'asc' ? 1 : -1
        if (a[sortConfig.key] < b[sortConfig.key]) return -1 * dir
        if (a[sortConfig.key] > b[sortConfig.key]) return 1 * dir
        return 0
      })
    }

    setFilteredRows(result)
  }

  useEffect(() => {
    applyFilters()
  }, [filters, rows, sortConfig])

  const toggleExpand = idx => {
    const next = new Set(expanded)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setExpanded(next)
  }

  const setSort = key => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  const clearAllFilters = () => {
    setFilters({
      minScore: '', maxScore: '',
      minVolume: '', maxVolume: '',
      minCPC: '', maxCPC: '',
      mapPackStatus: ''
    })
    setSelectedStates([])
    setSelectedCities([])
    setSelectedServices([])
    setKeywordInput('')
    setLocationInput('')
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

    let badgeColor = 'bg-gray-200 text-gray-600'
    let label = 'None'
    if (row.hasMapPack) {
      if (row.mapPackOverlap > 1 && row.mapPackWeak === 0) {
        badgeColor = 'bg-red-100 text-red-800'
        label = 'Strong'
      } else {
        badgeColor = 'bg-yellow-100 text-yellow-800'
        label = 'Weak'
      }
    }

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
            className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
          >
            {label}
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
        {rows.length > 0 && (
          <>
            <button onClick={downloadCSV} className="bg-blue-500 text-white px-3 py-1 rounded">Export CSV</button>
            <button onClick={downloadJSON} className="bg-green-500 text-white px-3 py-1 rounded">Export JSON</button>
          </>
        )}
        <button onClick={handleLoad} className="bg-black text-white px-3 py-1 rounded">Load</button>
        <button onClick={() => setFiltersCollapsed(prev => !prev)} className="bg-gray-300 text-black px-3 py-1 rounded">
          {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
        </button>
        <button onClick={clearAllFilters} className="bg-red-500 text-white px-3 py-1 rounded">Clear All Filters</button>
      </div>

      {!filtersCollapsed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 z-20 relative">
          <Select isMulti options={servicesList} value={selectedServices} onChange={setSelectedServices} placeholder="Services" />
          <Select isMulti options={allStates} value={selectedStates} onChange={setSelectedStates} placeholder="States" />
          <Select isMulti options={filteredCities} value={selectedCities} onChange={setSelectedCities} placeholder="Cities" />
          <input type="text" placeholder="Keyword(s)" className="border p-2" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} />
          <input type="text" placeholder="City, ST (e.g. Denver, CO)" className="border p-2" value={locationInput} onChange={e => setLocationInput(e.target.value)} />
          {['minScore', 'maxScore', 'minVolume', 'maxVolume', 'minCPC', 'maxCPC'].map((key) => (
            <div className="relative" key={key}>
              <input
                type="number"
                placeholder={key}
                className="border p-2 w-full pr-6"
                value={filters[key]}
                onChange={e => setFilters({ ...filters, [key]: e.target.value })}
              />
              {filters[key] && (
                <button onClick={() => setFilters({ ...filters, [key]: '' })}
                  className="absolute top-2 right-2 text-gray-500 hover:text-black text-sm">×</button>
              )}
            </div>
          ))}
          <select className="border p-2" value={filters.mapPackStatus} onChange={e => setFilters({ ...filters, mapPackStatus: e.target.value })}>
            <option value="">Map Pack</option>
            <option value="none">❌ None</option>
            <option value="weak">🟡 Weak</option>
            <option value="strong">🔴 Strong</option>
          </select>
        </div>
      )}

      {error && <div className="text-red-500 p-2">{error}</div>}

      <div className="border border-gray-300">
        <div className="flex bg-gray-100 sticky top-0 z-10 text-sm font-semibold">
          {['Keyword', 'Location', 'Volume', 'Cpc', 'Competition', 'Score', 'Map Pack', 'Breakdown'].map((col, i) => (
            <div
              key={col}
              onClick={() => setSort(col.toLowerCase().replace(' ', ''))}
              className={`p-2 ${['w-1/6', 'w-1/6', 'w-1/12', 'w-1/12', 'w-1/12', 'w-1/12', 'w-1/12', 'w-1/3'][i]} cursor-pointer hover:underline`}
            >
              {col}
              {sortConfig.key === col.toLowerCase().replace(' ', '') && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
            </div>
          ))}
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
