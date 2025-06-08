import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import Select from 'react-select';

const getColorByScore = (score) => {
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
};

const Heatmap = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

  useEffect(() => {
    fetch('/api/heatmap')
      .then((res) => res.json())
      .then((json) => {
        setData(json);

        const uniqueKeywords = [...new Set(json.map((item) => item.keyword))];
        const uniqueLocations = [...new Set(json.map((item) => item.location))];

        setKeywords(uniqueKeywords.map((k) => ({ value: k, label: k })));
        setLocations(uniqueLocations.map((l) => ({ value: l, label: l })));
        setSelectedKeywords(uniqueKeywords.map((k) => ({ value: k, label: k })));
        setSelectedLocations(uniqueLocations.map((l) => ({ value: l, label: l })));
      });
  }, []);

  useEffect(() => {
    const keywordValues = selectedKeywords.map((k) => k.value);
    const locationValues = selectedLocations.map((l) => l.value);

    const filteredData = data.filter(
      (item) =>
        keywordValues.includes(item.keyword) &&
        locationValues.includes(item.location)
    );
    setFiltered(filteredData);
  }, [data, selectedKeywords, selectedLocations]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Heatmap</h1>

      <div className="flex space-x-4">
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">Filter by Keyword</label>
          <Select
            options={keywords}
            value={selectedKeywords}
            onChange={(selected) => setSelectedKeywords(selected)}
            isMulti
          />
        </div>
        <div className="w-64">
          <label className="block text-sm font-medium mb-1">Filter by Location</label>
          <Select
            options={locations}
            value={selectedLocations}
            onChange={(selected) => setSelectedLocations(selected)}
            isMulti
          />
        </div>
      </div>

      <MapContainer center={[45.52, -122.67]} zoom={10} scrollWheelZoom className="h-[700px] w-full rounded shadow">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MarkerClusterGroup>
          {filtered.map((item, i) => (
            <CircleMarker
              key={`${item.latitude}-${item.longitude}-${i}`}
              center={[item.latitude, item.longitude]}
              radius={10}
              color={getColorByScore(item.score)}
              fillColor={getColorByScore(item.score)}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{item.name || 'Unnamed Business'}</strong><br />
                  📍 {item.address || 'N/A'}<br />
                  📞 {item.phone || 'N/A'}<br />
                  ⭐ {item.rating || 'N/A'} ({item.reviews || 0} reviews)<br />
                  🔑 {item.keyword} — {item.location}<br />
                  📊 Score: {item.score}<br />
                  🌐{' '}
                  {item.website ? (
                    <a href={item.website} target="_blank" rel="noreferrer" className="underline text-blue-500">
                      Website
                    </a>
                  ) : (
                    'No site'
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default Heatmap;
