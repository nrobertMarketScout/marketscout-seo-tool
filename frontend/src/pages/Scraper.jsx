import React, { useState } from 'react';
import axios from 'axios';

export default function Scraper () {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return alert('Please upload a CSV file.');

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResults([]);
    setErrors([]);

    try {
      const res = await axios.post('/api/run', formData);
      setResults(res.data.results || []);
      setErrors(res.data.errors || []);
    } catch (err) {
      console.error('Scrape error:', err);
      alert('Failed to run scrape.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Scrape Builder</h2>
      <input
        type="file"
        accept=".csv"
        onChange={e => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Running...' : 'Start Scrape'}
      </button>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <table className="min-w-full text-sm border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(results[0]).map((col) => (
                  <th key={col} className="px-2 py-1 border border-gray-300">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-2 py-1 border border-gray-300">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 text-red-600">
          <h4 className="font-bold">Errors</h4>
          <ul className="list-disc ml-5">
            {errors.map(({ keyword, location, error }, i) => (
              <li key={i}>{keyword} ({location}) – {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
