import { useState } from 'react';
import axios from 'axios';

const FALLBACK = {
  Plumber: ['Leak repair', 'Drain cleaning', 'Water heater', 'Pipe install'],
  Dentist: ['Teeth cleaning', 'Root canal', 'Whitening', 'Braces'],
  Electrician: ['Panel upgrade', 'Lighting install', 'Rewiring', 'EV charger']
};

export default function ServiceSelectorInline ({ city, niche, value, onChange }) {
  const [input, setInput] = useState('');
  const [loading, setLoad] = useState(false);

  const add = txt => {
    const svc = txt.trim();
    if (!svc || value.includes(svc) || value.length >= 6) return;
    onChange([...value, svc]);
    setInput('');
  };
  const remove = svc => onChange(value.filter(v => v !== svc));

  async function suggest () {
    if (!city || !niche) return alert('Select City & Niche first');
    setLoad(true);
    try {
      const { data } = await axios.get('/api/services/suggest', { params: { city, niche } });
      merge(data.services || []);
    } catch {
      const fb = FALLBACK[niche] || [];
      if (!fb.length) alert('Suggestions unavailable (quota exceeded). Enter services manually.');
      merge(fb);
    } finally { setLoad(false); }
  }

  const merge = list => {
    const lower = value.map(v => v.toLowerCase());
    const extras = list.filter(s => !lower.includes(s.toLowerCase())).slice(0, 6 - value.length);
    onChange([...value, ...extras]);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Services Offered <span className="text-xs text-gray-500">(max&nbsp;6)</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {value.map(svc => (
          <span key={svc}
            className="cursor-pointer rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
            onClick={() => remove(svc)}>
            {svc} ✕
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add(input)}
          placeholder="Type a service and press Enter"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button onClick={() => add(input)}
          className="rounded-lg bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300">Add</button>
        <button onClick={suggest} disabled={loading}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">
          {loading ? '…' : 'Suggest'}
        </button>
      </div>
    </div>
  );
}
