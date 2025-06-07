import React, { useEffect, useState } from 'react';

export default function Matrix () {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [groupFilter, setGroupFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [volumeMin, setVolumeMin] = useState(0);
  const [volumeMax, setVolumeMax] = useState(1000000);
  const [cpcMin, setCpcMin] = useState(0);
  const [cpcMax, setCpcMax] = useState(100);
  const [competitorsMax, setCompetitorsMax] = useState(1000);
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    fetch('/api/summary')
      .then(res => res.json())
      .then(json => {
        const rows = json.summary || [];
        setData(rows);
        setFiltered(rows);
      });
  }, []);

  useEffect(() => {
    const filteredData = data.filter(row => {
      const score = Number(row.Opportunity_Score ?? 0);
      const volume = Number(row.Volume ?? 0);
      const cpc = Number(row.CPC ?? 0);
      const competitors = Number(row.Competitors ?? 0);
      return (
        (!groupFilter || row.Group?.toLowerCase().includes(groupFilter.toLowerCase())) &&
        (!keywordFilter || row.Keyword?.toLowerCase().includes(keywordFilter.toLowerCase())) &&
        (!locationFilter || row.Location?.toLowerCase().includes(locationFilter.toLowerCase())) &&
        volume >= volumeMin &&
        volume <= volumeMax &&
        cpc >= cpcMin &&
        cpc <= cpcMax &&
        competitors <= competitorsMax &&
        score >= minScore &&
        score <= maxScore &&
        (!levelFilter || row.Opportunity_Level === levelFilter)
      );
    });
    setFiltered(filteredData);
  }, [
    data,
    groupFilter,
    keywordFilter,
    locationFilter,
    volumeMin,
    volumeMax,
    cpcMin,
    cpcMax,
    competitorsMax,
    minScore,
    maxScore,
    levelFilter
  ]);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4">📈 Opportunity Matrix</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Group</label>
          <input type="text" value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Keyword</label>
          <input type="text" value={keywordFilter} onChange={e => setKeywordFilter(e.target.value)} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Min Volume</label>
          <input type="number" min="0" value={volumeMin} onChange={e => setVolumeMin(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Volume</label>
          <input type="number" min="0" value={volumeMax} onChange={e => setVolumeMax(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Min CPC</label>
          <input type="number" min="0" value={cpcMin} onChange={e => setCpcMin(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Max CPC</label>
          <input type="number" min="0" value={cpcMax} onChange={e => setCpcMax(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Competitors</label>
          <input type="number" min="0" value={competitorsMax} onChange={e => setCompetitorsMax(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Min Score</label>
          <input type="number" min="0" value={minScore} onChange={e => setMinScore(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Score</label>
          <input type="number" min="0" value={maxScore} onChange={e => setMaxScore(Math.max(0, Number(e.target.value)))} className="border rounded p-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Level</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="border rounded p-1 w-full">
            <option value="">— Any —</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-xl shadow text-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Group</th>
              <th className="px-4 py-2">Keyword</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2 text-right">Volume</th>
              <th className="px-4 py-2 text-right">CPC</th>
              <th className="px-4 py-2 text-right">Competitors</th>
              <th className="px-4 py-2 text-right">Score</th>
              <th className="px-4 py-2 text-center">Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="px-4 py-2">{row.Group}</td>
                <td className="px-4 py-2">{row.Keyword}</td>
                <td className="px-4 py-2">{row.Location}</td>
                <td className="px-4 py-2 text-right">{row.Volume}</td>
                <td className="px-4 py-2 text-right">
                  {row.CPC !== undefined && !isNaN(row.CPC)
                    ? `$${Number(row.CPC).toFixed(2)}`
                    : '—'}
                </td>
                <td className="px-4 py-2 text-right">{row.Competitors}</td>
                <td className="px-4 py-2 text-right font-semibold">{row.Opportunity_Score}</td>
                <td className={`px-4 py-2 text-center font-bold ${row.Opportunity_Level === 'High' ? 'text-green-600'
                    : row.Opportunity_Level === 'Medium' ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                  {row.Opportunity_Level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
