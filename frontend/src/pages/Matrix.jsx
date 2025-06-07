// frontend/src/pages/Matrix.jsx
import React, { useEffect, useState } from 'react';

export default function Matrix () {
  const [matrix, setMatrix] = useState([]);
  const [sortKey, setSortKey] = useState('Opportunity_Score');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/matrix')
      .then(res => res.json())
      .then(json => setMatrix(json.matrix || []))
      .catch(() => setMatrix([]));
  }, []);

  const handleSort = (key) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...matrix].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA || '').localeCompare(String(valB || ''))
      : String(valB || '').localeCompare(String(valA || ''));
  });

  const visibleCols = [
    'Group', 'Keyword', 'Location', 'Rating', 'Reviews', 'Address', 'Website',
    'Opportunity_Score', 'Opportunity_Level', 'Opportunity_Insights'
  ];

  const columnLabels = {
    Group: 'Group',
    Keyword: 'Keyword',
    Location: 'Location',
    Rating: '⭐️ Rating',
    Reviews: '💬 Reviews',
    Address: '📍 Address',
    Website: '🔗 Website',
    Opportunity_Score: '🏆 Score',
    Opportunity_Level: '🔥 Level',
    Opportunity_Insights: '💡 Insights'
  };

  const levelColor = level => {
    if (level === 'High') return 'text-green-600 font-semibold';
    if (level === 'Medium') return 'text-yellow-600 font-semibold';
    if (level === 'Low') return 'text-red-600 font-semibold';
    return '';
  };

  const renderInsights = (str) => {
    const insights = str?.split(',').map(i => i.trim()).filter(Boolean) || [];
    return (
      <div className="flex flex-wrap gap-1">
        {insights.map((tag, i) => (
          <span
            key={i}
            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-300"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📈 Combined Opportunity Matrix</h2>
      <div className="overflow-auto border rounded-xl shadow text-sm">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              {visibleCols.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`px-3 py-2 border cursor-pointer select-none ${sortKey === col ? 'bg-yellow-200' : ''
                    }`}
                >
                  {columnLabels[col] || col}
                  {sortKey === col && (sortAsc ? ' 🔼' : ' 🔽')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="even:bg-gray-50 hover:bg-yellow-50 transition">
                {visibleCols.map(col => (
                  <td key={col} className="px-3 py-2 border whitespace-nowrap">
                    {col === 'Opportunity_Level' ? (
                      <span className={levelColor(row[col])}>{row[col]}</span>
                    ) : col === 'Opportunity_Insights' ? (
                      renderInsights(row[col])
                    ) : (
                      row[col] || '—'
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
