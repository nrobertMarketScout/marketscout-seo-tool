// frontend/src/pages/Matrix.jsx
import React, { useEffect, useState } from 'react';

export default function Matrix () {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/matrix')
      .then(res => res.json())
      .then(json => setMatrix(json.matrix || []))
      .catch(() => setError('Failed to load matrix data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading matrix...</p>;
  if (error) return <p className="text-red-600 p-4">{error}</p>;
  if (!matrix.length) return <p className="p-4">No matrix data found.</p>;

  // Define visible columns and their display labels
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

  // Style helper for Level
  const levelColor = level => {
    if (level === 'High') return 'text-green-600 font-semibold';
    if (level === 'Medium') return 'text-yellow-600 font-semibold';
    if (level === 'Low') return 'text-red-600 font-semibold';
    return '';
  };

  // Convert CSV insight string into pill tags
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
                <th key={col} className="px-3 py-2 border text-left">
                  {columnLabels[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
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
