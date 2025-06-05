// frontend/src/pages/Estimator.jsx
import React, { useState } from 'react';

export default function Estimator () {
  const [volume, setVolume] = useState(100);
  const [conversionRate, setConversionRate] = useState(10);
  const [closeRate, setCloseRate] = useState(20);
  const [valuePerClient, setValuePerClient] = useState(500);

  const estimate = () => {
    const leads = (volume * conversionRate) / 100;
    const clients = (leads * closeRate) / 100;
    return clients * valuePerClient;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">📈 Lead Estimator</h2>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <label>
          Search Volume
          <input
            type="number"
            value={volume}
            onChange={(e) => setVolume(+e.target.value)}
            className="block w-full border rounded p-2"
          />
        </label>
        <label>
          Conversion Rate (%)
          <input
            type="number"
            value={conversionRate}
            onChange={(e) => setConversionRate(+e.target.value)}
            className="block w-full border rounded p-2"
          />
        </label>
        <label>
          Close Rate (%)
          <input
            type="number"
            value={closeRate}
            onChange={(e) => setCloseRate(+e.target.value)}
            className="block w-full border rounded p-2"
          />
        </label>
        <label>
          Value Per Client ($)
          <input
            type="number"
            value={valuePerClient}
            onChange={(e) => setValuePerClient(+e.target.value)}
            className="block w-full border rounded p-2"
          />
        </label>
      </div>
      <div className="text-lg font-semibold">
        💰 Estimated Monthly Value: ${estimate().toLocaleString()}
      </div>
    </div>
  );
}


