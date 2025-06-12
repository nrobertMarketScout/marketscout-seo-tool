import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import SideNav from '@/components/SideNav';
import HelpTip from '@/components/HelpTip';
import HeroEditor from '@/components/HeroEditor';
import ServiceSelector from '@/components/ServiceSelectorInline';   // ⬅️ new import

export default function SiteBuilder () {
  /* ─── state ─────────────────────────────────────────────────────────── */
  const [city, setCity] = useState(null);
  const [niche, setNiche] = useState(null);
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('lite');
  const [competitors, setComp] = useState('');
  const [services, setServices] = useState([]);

  const [metaKw, setMetaKw] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc] = useState('');
  const [schema, setSchema] = useState(false);

  const [hero, setHero] = useState({ image: '', heading: '', sub: '' });
  const [showHero, setShowHero] = useState(false);

  const [cityOpts, setCityOpts] = useState([]);
  const [nicheOpts, setNicheOpts] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);
  const apiBase = 'http://localhost:3001';

  /* ─── load picklists ────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const c = await fetch('/api/meta/cities').then(r => r.json());
      const n = await fetch('/api/meta/niches').then(r => r.json());
      setCityOpts(c.cities.map(v => ({ value: v, label: v })));
      setNicheOpts(n.niches.map(v => ({ value: v, label: v })));
    })();
  }, []);

  /* auto-scroll */
  useEffect(() => { result && resultRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [result]);

  /* ─── helpers ───────────────────────────────────────────────────────── */
  const Txt = ({ label, val, setVal }) => (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>
      <input value={val} onChange={e => setVal(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2" />
    </div>
  );

  async function generate () {
    if (!city || !niche) return alert('Choose a city & niche');
    setLoading(true);
    try {
      const endpoint = mode === 'full' ? '/api/site/full' : '/api/site';
      const payload = {
        city: city.value, niche: niche.value, phone, competitors,
        hero, services, writingStyle: 'professional',
        meta_keywords: metaKw, og_title: ogTitle, og_description: ogDesc,
        schema_toggle: schema
      };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json());
      if (!res.success) throw new Error(res.error || 'Generation failed');
      setResult(res);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }

  /* ─── UI ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <SideNav />

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0052ff] via-[#306dff] to-[#4782ff] py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">

          <div className="mb-4 text-right">
            <button onClick={() => setShowHero(true)}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium shadow">✏️ Edit Hero</button>
          </div>

          <div className="rounded-3xl bg-white/95 backdrop-blur shadow-2xl">
            <div className="space-y-8 p-8 sm:p-12">

              {/* row 1 */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">City</label>
                  <Select options={cityOpts} value={city} onChange={setCity} isClearable />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Niche / Service</label>
                  <Select options={nicheOpts} value={niche} onChange={setNiche} isClearable />
                </div>
                <Txt label="Phone (optional)" val={phone} setVal={setPhone} />
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Site Type</label>
                  <select value={mode} onChange={e => setMode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="lite">One-Pager (Lite)</option>
                    <option value="full">Full Site (4 pages)</option>
                  </select>
                </div>
              </div>

              {/* competitors */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Top Competitor URLs (optional)</label>
                <textarea rows={3} value={competitors} onChange={e => setComp(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>

              {/* services inline */}
              <ServiceSelector
                city={city?.value} niche={niche?.value}
                value={services} onChange={setServices}
              />

              {/* SEO / Social */}
              <fieldset className="rounded-2xl border border-gray-200 p-6">
                <legend className="px-2 text-sm font-semibold text-gray-700">SEO / Social</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Txt label="Meta Keywords" val={metaKw} setVal={setMetaKw} />
                  <Txt label={<span className="flex items-center gap-1">OG Title <HelpTip text="Open Graph title" /></span>}
                    val={ogTitle} setVal={setOgTitle} />
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    OG Description <HelpTip text="Shown under OG title" />
                  </label>
                  <textarea rows={2} value={ogDesc} onChange={e => setOgDesc(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input type="checkbox" checked={schema} onChange={e => setSchema(e.target.checked)} />
                  Include basic Schema.org markup
                </label>
              </fieldset>

              <button onClick={generate} disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 font-semibold text-white">
                {loading ? 'Generating…' : 'Generate Site'}
              </button>
            </div>
          </div>

          {/* result */}
          {result && (
            <div ref={resultRef} className="mt-8 space-y-4 rounded-3xl bg-white/95 p-8 shadow-lg backdrop-blur">
              <h2 className="text-xl font-semibold text-gray-800">Generated Site</h2>
              <div className="flex gap-3 flex-wrap">
                <a href={result.downloadUrl} className="rounded-lg bg-gray-200 px-4 py-2 shadow">Download</a>
                <a href={`${apiBase}${result.previewUrl}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow">Preview</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* hero modal */}
      {showHero && <HeroEditor value={hero} onChange={setHero} onClose={() => setShowHero(false)} />}
    </div>
  );
}
