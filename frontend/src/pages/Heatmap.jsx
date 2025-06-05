// frontend/src/pages/Heatmap.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function Heatmap () {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => setLoading(false);
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  useEffect(() => {
    axios.head('/heatmap/density_heatmap.html')
      .then(() => setError(null))
      .catch(() => setError('Heatmap file not found.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🗺️ Heatmap Visualization</h2>
      {loading && <p className="mb-2">Loading map...</p>}
      <iframe
        ref={iframeRef}
        src="/heatmap/density_heatmap.html"
        title="Opportunity Heatmap"
        className="w-full h-[80vh] border rounded-lg"
      ></iframe>
    </div>
  );
}
