// frontend/src/pages/Scraper.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function Scraper () {
  const [file, setFile] = useState(null);
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setLog('');
    setDownloadUrl(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setLog('Uploading file and starting scrape...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/scrape', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLog(res.data.log || 'Scrape completed.');
      setDownloadUrl(res.data.zipUrl || null);
    } catch (err) {
      setLog('❌ Failed to start scrape.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🛠️ Scrape Engine</h2>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full file:mr-4 file:px-4 file:py-2 file:border-0 file:rounded-md file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Start Scrape'}
      </button>

      {log && (
        <pre className="bg-gray-900 text-green-300 text-sm p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
          {log}
        </pre>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="inline-block mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          📦 Download Results (ZIP)
        </a>
      )}
    </div>
  );
}