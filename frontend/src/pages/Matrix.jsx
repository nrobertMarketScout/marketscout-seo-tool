// frontend/src/pages/Matrix.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Matrix () {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    group: '',
    minScore: '',
    maxScore: '',
    minVolume: '',
    maxVolume: '',
    minCPC: '',
    maxCPC: '',
    level: ''
  });

  useEffect(() => {
    axios.get('/api/summary')
      .then(res => setData(res.data.summary || []))
      .catch(err => console.error('❌ Failed to fetch summary:', err));
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredData = data.filter(row => {
    const {
      keyword,
      location,
      group,
      minScore,
      maxScore,
      minVolume,
      maxVolume,
      minCPC,
      maxCPC,
      level
    } = filters;

    if (keyword && !row.Keyword?.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (location && !row.Location?.toLowerCase().includes(location.toLowerCase())) return false;
    if (group && !row.Group?.toLowerCase().includes(group.toLowerCase())) return false;
    if (minScore !== '' && row.Opportunity_Score < parseFloat(minScore)) return false;
    if (maxScore !== '' && row.Opportunity_Score > parseFloat(maxScore)) return false;
    if (minVolume !== '' && row.Volume < parseFloat(minVolume)) return false;
    if (maxVolume !== '' && row.Volume > parseFloat(maxVolume)) return false;
    if (minCPC !== '' && row.CPC < parseFloat(minCPC)) return false;
    if (maxCPC !== '' && row.CPC > parseFloat(maxCPC)) return false;
    if (level && level !== 'All' && row.Opportunity_Level !== level) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">🧱 Opportunity Matrix</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl shadow">
        <input
          placeholder="Keyword"
          className="p-2 border rounded"
          value={filters.keyword}
          onChange={e => handleFilterChange('keyword', e.target.value)}
        />
        <input
          placeholder="Location"
          className="p-2 border rounded"
          value={filters.location}
          onChange={e => handleFilterChange('location', e.target.value)}
        />
        <input
          placeholder="Group"
          className="p-2 border rounded"
          value={filters.group}
          onChange={e => handleFilterChange('group', e.target.value)}
        />
        <input
          placeholder="Min Score"
          className="p-2 border rounded"
          type="number"
          value={filters.minScore}
          onChange={e => handleFilterChange('minScore', e.target.value)}
        />
        <input
          placeholder="Max Score"
          className="p-2 border rounded"
          type="number"
          value={filters.maxScore}
          onChange={e => handleFilterChange('maxScore', e.target.value)}
        />
        <input
          placeholder="Min Volume"
          className="p-2 border rounded"
          type="number"
          value={filters.minVolume}
          onChange={e => handleFilterChange('minVolume', e.target.value)}
        />
        <input
          placeholder="Max Volume"
          className="p-2 border rounded"
          type="number"
          value={filters.maxVolume}
          onChange={e => handleFilterChange('maxVolume', e.target.value)}
        />
        <input
          placeholder="Min CPC"
          className="p-2 border rounded"
          type="number"
          value={filters.minCPC}
          onChange={e => handleFilterChange('minCPC', e.target.value)}
        />
        <input
          placeholder="Max CPC"
          className="p-2 border rounded"
          type="number"
          value={filters.maxCPC}
          onChange={e => handleFilterChange('maxCPC', e.target.value)}
        />
        <select
          className="p-2 border rounded"
          value={filters.level}
          onChange={e => handleFilterChange('level', e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-xl shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Keyword</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Group</th>
              <th className="px-4 py-2">Volume</th>
              <th className="px-4 py-2">CPC</th>
              <th className="px-4 py-2">Opportunity Score</th>
              <th className="px-4 py-2">Opportunity Level</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="px-4 py-2">{row.Keyword}</td>
                <td className="px-4 py-2">{row.Location}</td>
                <td className="px-4 py-2">{row.Group}</td>
                <td className="px-4 py-2">{row.Volume ?? '—'}</td>
                <td className="px-4 py-2">
                  {row.CPC !== undefined && !isNaN(row.CPC) ? `$${Number(row.CPC).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-2">{row.Opportunity_Score}</td>
                <td className={`px-4 py-2 font-semibold ${row.Opportunity_Level === 'High' ? 'text-green-600' :
                    row.Opportunity_Level === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                  }`}>
                  {row.Opportunity_Level}
                </td>
              </tr>
            ))}
            {!filteredData.length && (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 px-4 py-6">No matching results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
