// frontend/src/pages/Summary.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ResultsTable from '../components/ResultsTable';

export default function Summary () {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/summary')
      .then(res => setSummary(res.data.summary || []))
      .catch(err => setError('Failed to load summary data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading summary...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary.length) return <p>No data found. Try running a scrape.</p>;

  return (
    <div className="p-6 space-y-8">
      {/* Opportunity Summary Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📊 Opportunity Summary</h2>
        <div className="overflow-auto">
          <table className="min-w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border">Group</th>
                <th className="px-2 py-1 border">Location</th>
                <th className="px-2 py-1 border text-right">Volume</th>
                <th className="px-2 py-1 border text-right">CPC</th>
                <th className="px-2 py-1 border text-right">Competitors</th>
                <th className="px-2 py-1 border">Thin Pack</th>
                <th className="px-2 py-1 border">Low Reviews</th>
                <th className="px-2 py-1 border">Missing Site</th>
                <th className="px-2 py-1 border text-right">Score</th>
                <th className="px-2 py-1 border text-center">Level</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 border whitespace-nowrap">{row.Group}</td>
                  <td className="px-2 py-1 border whitespace-nowrap">{row.Location}</td>
                  <td className="px-2 py-1 border text-right">
                    {row.Volume !== undefined && !isNaN(row.Volume)
                      ? Number(row.Volume).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-2 py-1 border text-right">
                    {row.CPC !== undefined && !isNaN(row.CPC)
                      ? `$${Number(row.CPC).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-2 py-1 border text-right">{row.Competitors || 0}</td>
                  <td className="px-2 py-1 border text-center">{row.ThinPack ? '✅' : ''}</td>
                  <td className="px-2 py-1 border text-center">{row.LowReviews ? '✅' : ''}</td>
                  <td className="px-2 py-1 border text-center">{row.MissingWebsite ? '✅' : ''}</td>
                  <td className="px-2 py-1 border text-right font-semibold">
                    {row.Opportunity_Score !== undefined && !isNaN(row.Opportunity_Score)
                      ? row.Opportunity_Score
                      : '—'}
                  </td>
                  <td className={`px-2 py-1 border text-center font-bold ${row.Opportunity_Level === 'High'
                      ? 'text-green-600'
                      : row.Opportunity_Level === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                    {row.Opportunity_Level || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Scrape Results Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📋 Full Scrape Results</h2>
        <ResultsTable />
      </div>
    </div>
  );
}
