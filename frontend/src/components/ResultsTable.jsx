import React, { useEffect, useState } from 'react';

export default function ResultsTable () {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/results')
      .then(res => res.json())
      .then(json => setData(json.data))
      .catch(err => console.error('Failed to fetch results:', err));
  }, []);

  if (data.length === 0) return <div className="text-center p-4">No results found.</div>;

  // Define only the fields we want to show
  const visibleCols = [
    'Group', 'Keyword', 'Location', 'Name',
    'Rating', 'Reviews', 'Address', 'Website'
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Scraped Results</h2>
      <div className="overflow-auto border rounded-xl shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {visibleCols.map(col => (
                <th key={col} className="px-4 py-2 border-b font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="even:bg-gray-50 hover:bg-yellow-50 transition">
                {visibleCols.map(col => (
                  <td key={col} className="px-4 py-2 border-b">{row[col] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
