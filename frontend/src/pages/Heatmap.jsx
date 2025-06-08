import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import {
  Slider,
  MenuItem,
  Select,
  Button,
  Box,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Paper
} from "@mui/material";
import { Close as CloseIcon, FilterList as FilterIcon } from "@mui/icons-material";

const ScoreLegend = () => (
  <div style={{
    position: "absolute",
    bottom: 10,
    left: 10,
    background: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 0 5px rgba(0,0,0,0.3)",
    fontSize: "0.8rem",
    zIndex: 999
  }}>
    <strong>Score Legend</strong><br />
    <span style={{ color: "#2c7bb6" }}>● Low (0–25)</span><br />
    <span style={{ color: "#fdae61" }}>● Medium (26–74)</span><br />
    <span style={{ color: "#d7191c" }}>● High (75–100)</span>
  </div>
);

const Heatmap = () => {
  const [data, setData] = useState([]);
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [initialCenter, setInitialCenter] = useState([45.52, -122.68]);
  const [showPanel, setShowPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 10, y: 60 });
  const mapRef = useRef();

  useEffect(() => {
    fetch("/api/heatmap")
      .then((res) => res.json())
      .then((json) => {
        const cleaned = json.filter(
          (r) =>
            !isNaN(r.latitude) &&
            !isNaN(r.longitude) &&
            r.longitude > -130 && r.longitude < -60 &&
            r.latitude > 20 && r.latitude < 60
        );
        setData(cleaned);
        if (cleaned.length > 0) {
          setInitialCenter([cleaned[0].latitude, cleaned[0].longitude]);
        }
      })
      .catch((err) => console.error("Heatmap fetch error:", err));
  }, []);

  const keywords = [...new Set(data.map((r) => r.keyword))];
  const locations = [...new Set(data.map((r) => r.location))];

  const filtered = useMemo(() => {
    return data.filter(
      (row) =>
        row.score >= scoreRange[0] &&
        row.score <= scoreRange[1] &&
        (keywordFilter === "" || row.keyword === keywordFilter) &&
        (locationFilter === "" || row.location === locationFilter)
    );
  }, [data, scoreRange, keywordFilter, locationFilter]);

  const getColor = (score) => {
    if (score >= 75) return "#d7191c";
    if (score >= 26) return "#fdae61";
    return "#2c7bb6";
  };

  const handleExport = () => {
    const header = [
      "Name", "Address", "Phone", "Rating", "Reviews", "Website",
      "Keyword", "Location", "Latitude", "Longitude", "Score",
    ];
    const rows = filtered.map((r) => [
      r.name ?? "", r.address ?? "", r.phone ?? r.phone_number ?? "",
      r.rating ?? "", r.reviews ?? r.reviews_count ?? "", r.website ?? "",
      r.keyword, r.location, r.latitude, r.longitude, r.score,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heatmap_filtered.csv";
    a.click();
  };

  return (
    <div style={{ height: "calc(100vh - 60px)", position: "relative" }}>
      <MapContainer
        center={initialCenter}
        zoom={12}
        style={{ height: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <MarkerClusterGroup>
          {filtered.map((r, idx) => (
            <CircleMarker
              key={`${r.latitude}_${r.longitude}_${idx}`}
              center={[r.latitude, r.longitude]}
              radius={10}
              pathOptions={{ color: getColor(r.score), fillOpacity: 0.7 }}
            >
              <Popup>
                <div>
                  <strong>{r.name || "Unnamed Business"}</strong><br />
                  📍 {r.address || "N/A"}<br />
                  ☎ {r.phone ?? r.phone_number ?? "N/A"}<br />
                  ⭐ {r.rating ?? "N/A"} ({r.reviews ?? r.reviews_count ?? 0} reviews)<br />
                  🔑 {r.keyword} — {r.location}<br />
                  📊 Score: {r.score}<br />
                  🌐 {r.website ? (
                    <a href={r.website} target="_blank" rel="noreferrer">Website</a>
                  ) : "No site"}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <ScoreLegend />

      <IconButton
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1200,
          background: "#fff"
        }}
        size="large"
      >
        {showPanel ? <CloseIcon /> : <FilterIcon />}
      </IconButton>

      {showPanel && (
        <Box
          sx={{
            position: "absolute",
            top: panelPosition.y,
            left: panelPosition.x,
            background: "#fff",
            p: 2,
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1100,
            width: 280,
            cursor: "grab"
          }}
          onMouseDown={(e) => {
            const shiftX = e.clientX - e.currentTarget.getBoundingClientRect().left;
            const shiftY = e.clientY - e.currentTarget.getBoundingClientRect().top;

            const handleMouseMove = (e) => {
              setPanelPosition({
                x: e.clientX - shiftX,
                y: e.clientY - shiftY,
              });
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        >
          <Typography fontWeight="bold" gutterBottom>
            Filter by Score
          </Typography>

          <Slider
            value={scoreRange}
            onChange={(_, newVal) => setScoreRange(newVal)}
            valueLabelDisplay="auto"
            min={0}
            max={100}
            sx={{ mt: 1, mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Keyword</InputLabel>
            <Select
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              label="Keyword"
            >
              <MenuItem value=""><em>All Keywords</em></MenuItem>
              {keywords.map((k) => (
                <MenuItem key={k} value={k}>{k}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              label="Location"
            >
              <MenuItem value=""><em>All Locations</em></MenuItem>
              {locations.map((l) => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleExport} fullWidth>
            Export CSV
          </Button>
        </Box>
      )}
    </div>
  );
};

export default Heatmap;
