import React, { useState } from 'react';

export default function SiteBuilder() {
  /* ---------- state ---------- */
  const [city, setCity]       = useState('');
  const [niche, setNiche]     = useState('');
  const [phone, setPhone]     = useState('');
  const [mode, setMode]       = useState('lite');          // lite | full
  const [competitors, setComp] = useState('');

  const [metaKw, setKW]       = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc]   = useState('');
  const [schema, setSchema]   = useState(false);

  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const apiBase               = 'http://localhost:3001';

  /* ---------- helpers ---------- */
  const generate = async () => {
    if (!city || !niche) return alert('City & niche required');
    setLoading(true);
    try {
      const endpoint = mode === 'full' ? '/api/site/full' : '/api/site';
      const body = {
        city, niche, phone, competitors, writingStyle: 'professional',
        meta_keywords: metaKw, og_title: ogTitle, og_description: ogDesc, schema_toggle: schema
      };
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
                    .then(r=>r.json());
      if (!res.success) throw new Error(res.error || 'failed');
      setResult(res);
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      {/* header */}
      <h1 className="text-3xl font-extrabold text-indigo-600 flex items-center gap-2 mb-8">
        <span className="text-4xl">📐</span> Site Builder
      </h1>

      {/* card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="p-10 space-y-8">

          {/* input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input value={city} onChange={e=>setCity(e.target.value)}
                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Niche / Service</label>
              <input value={niche} onChange={e=>setNiche(e.target.value)}
                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (optional)</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)}
                     className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Site Type</label>
              <select value={mode} onChange={e=>setMode(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="lite">One-Pager (Lite)</option>
                <option value="full">Full Site (4 pages)</option>
              </select>
            </div>
          </div>

          {/* competitor URLs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Top Competitor URLs (optional)</label>
            <textarea rows={3} value={competitors} onChange={e=>setComp(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>

          {/* SEO / Social section */}
          <fieldset className="border border-gray-200 rounded-2xl p-6">
            <legend className="px-2 text-sm font-semibold text-gray-700">SEO / Social</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Meta Keywords</label>
                <input value={metaKw} onChange={e=>setKW(e.target.value)}
                       className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">OG Title</label>
                <input value={ogTitle} onChange={e=>setOgTitle(e.target.value)}
                       className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-600">OG Description</label>
              <textarea rows={2} value={ogDesc} onChange={e=>setOgDesc(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <label className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-700">
              <input type="checkbox" checked={schema} onChange={e=>setSchema(e.target.checked)} />
              Include basic Schema.org
            </label>
          </fieldset>

          {/* generate button */}
          <button onClick={generate} disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow hover:opacity-90">
            {loading ? 'Generating…' : 'Generate Site'}
          </button>
        </div>
      </div>

      {/* result panel */}
      {result && (
        <div className="max-w-4xl mx-auto mt-8 bg-white rounded-3xl shadow-lg p-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Generated Site</h2>
          <div className="flex flex-wrap gap-3">
            <a href={result.downloadUrl} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 shadow hover:bg-gray-300">Download</a>
            <a href={`${apiBase}${result.previewUrl}`} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700">Preview</a>
            {mode === 'lite' ? (
              <a href={`${apiBase}/api/site/source/${result.slug}`} target="_blank" rel="noopener noreferrer"
                 className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 shadow hover:bg-gray-300">View Source</a>
            ) : (
              <select className="rounded-lg border-gray-300"
                      onChange={e=>{
                        const p=e.target.value;
                        if(p) window.open(`${apiBase}/api/site/source/${result.slug}/${p}`,'_blank');
                      }}>
                <option value="">View Source…</option>
                {['index','services','about','contact'].map(p=> <option key={p} value={p}>{p}.html</option>)}
              </select>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {mode==='lite' ? 'One-pager generated.' : 'Full site generated & zipped.'}
          </p>
        </div>
      )}
    </div>
  );
}
