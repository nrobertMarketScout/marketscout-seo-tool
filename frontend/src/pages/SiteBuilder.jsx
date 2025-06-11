// frontend/src/pages/SiteBuilder.jsx
import React, { useState } from 'react';

export default function SiteBuilder () {
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!city || !niche) return alert('City and niche are required');

    setLoading(true);
    try {
      const res = await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, niche, competitors, phone, writingStyle: 'professional' })
      }).then((r) => r.json());

      if (!res.success) throw new Error(res.error || 'Failed');
      setResult(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper: build absolute URL for preview/source when on Vite dev server
  const apiBase = 'http://localhost:3001';

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">Site Builder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---- Input form ---- */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              className="w-full rounded-lg border-gray-300 focus:ring-indigo-500"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Niche / Service</label>
            <input
              className="w-full rounded-lg border-gray-300 focus:ring-indigo-500"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Competitor Notes (optional)</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border-gray-300 focus:ring-indigo-500"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Paste top competitor URLs or notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input
              className="w-full rounded-lg border-gray-300 focus:ring-indigo-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-123-4567"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700"
          >
            {loading ? 'Generating…' : 'Generate Site'}
          </button>
        </div>

        {/* ---- Output preview ---- */}
        {result && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Preview</h2>
            <p><strong>SEO Title:</strong> {result.content.seo_title}</p>
            <p><strong>Meta Description:</strong> {result.content.meta_description}</p>
            <p><strong>Heading:</strong> {result.content.heading}</p>
            <p><strong>Intro:</strong> {result.content.intro_section}</p>

            <div className="flex flex-wrap gap-2">
              {/* Download HTML */}
              <a
                href={result.downloadUrl}
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 shadow hover:bg-gray-300"
              >
                Download HTML
              </a>

              {/* Preview Online */}
              <a
                href={`${apiBase}${result.previewUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700"
              >
                Preview Online
              </a>

              {/* View Source */}
              <a
                href={`${apiBase}/api/site/source/${result.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 shadow hover:bg-gray-300"
              >
                View&nbsp;Source
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
