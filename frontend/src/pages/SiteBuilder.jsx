/*  frontend/src/pages/SiteBuilder.jsx  */
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import SideNav from '@/components/SideNav';
import HelpTip from '@/components/HelpTip';
import HeroEditor from '@/components/HeroEditor';
import ServiceSelectorInline from '@/components/ServiceSelectorInline';
import axios from 'axios';

/* ────────────────────────────────────────────────────────── */

export default function SiteBuilder () {
  /* ───── state ───── */
  const [city, setCity] = useState(null);
  const [niche, setNiche] = useState(null);
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState('lite');
  const [compUrls, setCompUrls] = useState('');
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

  /* ───── load pick-lists once ───── */
  useEffect(() => {
    (async () => {
      const c = await axios.get('/api/meta/cities').then(r => r.data.cities);
      const n = await axios.get('/api/meta/niches').then(r => r.data.niches);
      setCityOpts(c.map(v => ({ value: v, label: v })));
      setNicheOpts(n.map(v => ({ value: v, label: v })));
    })();
  }, []);

  /* ───── auto-scroll to result ───── */
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result]);

  /* ───── helpers ───── */
  const Txt = ({ label, val, setVal }) => (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2" />
    </div>
  );

  /* ───── generate site bundle ───── */
  async function generate () {
    if (!city || !niche) return alert('Choose city and niche');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/site/bundle', {
        city: city.value, niche: niche.value, phone,
        competitors: compUrls, services, hero,
        meta_keywords: metaKw, og_title: ogTitle,
        og_description: ogDesc, schema_toggle: schema,
        writingStyle: 'professional', mode
      });
      if (!data.success) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }

  /* ───── UI ───── */
  return (
    <div className="flex min-h-screen">
      <SideNav />

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0052ff] via-[#306dff] to-[#4782ff] py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">

          {/* top-right hero edit */}
          <div className="mb-4 text-right">
            <button
              onClick={() => setShowHero(true)}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium shadow">
              ✏️ Edit Hero Section
            </button>
          </div>

          {/* main form card */}
          <div className="rounded-3xl bg-white/95 shadow-2xl backdrop-blur">
            <div className="space-y-8 p-8 sm:p-12">

              {/* city / niche / phone / mode */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">City</label>
                  <Select options={cityOpts} value={city} onChange={setCity} isClearable />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Niche</label>
                  <Select options={nicheOpts} value={niche} onChange={setNiche} isClearable />
                </div>
                <Txt label="Phone (optional)" val={phone} setVal={setPhone} />
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Site Type</label>
                  <select value={mode} onChange={e => setMode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="lite">Lite</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>

              {/* competitors */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Competitor URLs (optional)
                </label>
                <textarea
                  rows={3}
                  value={compUrls}
                  onChange={e => setCompUrls(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>

              {/* services selector */}
              <ServiceSelectorInline
                city={city?.value}
                niche={niche?.value}
                value={services}
                onChange={setServices}
              />

              {/* SEO / OG fieldset */}
              <fieldset className="rounded-2xl border border-gray-200 p-6">
                <legend className="px-2 text-sm font-semibold text-gray-700">SEO / Social</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Txt label="Meta Keywords" val={metaKw} setVal={setMetaKw} />
                  <Txt label={<span className="flex items-center gap-1">
                    OG Title <HelpTip text="Open Graph title" />
                  </span>}
                    val={ogTitle} setVal={setOgTitle} />
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    OG Description <HelpTip text="Description in social shares" />
                  </label>
                  <textarea
                    rows={2}
                    value={ogDesc}
                    onChange={e => setOgDesc(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input type="checkbox" checked={schema} onChange={e => setSchema(e.target.checked)} />
                  Include basic Schema.org markup
                </label>
              </fieldset>

              {/* generate button */}
              <button
                onClick={generate}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 font-semibold text-white disabled:opacity-60">
                {loading ? 'Generating…' : 'Generate Site'}
              </button>
            </div>
          </div>

          {/* result panel */}
          {result && (
            <div
              ref={resultRef}
              className="mt-8 space-y-4 rounded-3xl bg-white/95 p-8 shadow-lg backdrop-blur">
              <h2 className="text-xl font-semibold text-gray-800">Generated Site</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={result.previewUrl}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow"
                  target="_blank" rel="noopener noreferrer">Preview</a>

                <a
                  href={result.downloadUrl}
                  className="rounded-lg bg-gray-200 px-4 py-2 shadow">Download</a>

                <a
                  href={`http://localhost:3001/view-source?file=uploads/${result.slug}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300">
                  View Source
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {showHero && (
        <HeroEditor
          value={hero}
          onChange={setHero}
          onClose={() => setShowHero(false)}
        />
      )}
    </div>
  );
}
