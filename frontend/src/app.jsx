// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Matrix from './pages/Matrix';
import Heatmap from './pages/Heatmap';
import Scraper from './pages/Scraper';
import Bot from './pages/Bot';

export default function App () {
  const navClass = ({ isActive }) =>
    isActive
      ? 'px-4 py-2 bg-blue-600 text-white rounded'
      : 'px-4 py-2 text-blue-600 hover:underline';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="flex gap-4 p-4 shadow bg-white border-b">
          <NavLink to="/matrix" className={navClass}>📈 Matrix</NavLink>
          <NavLink to="/heatmap" className={navClass}>🗺️ Heatmap</NavLink>
          <NavLink to="/scraper" className={navClass}>🛠️ Scraper</NavLink>
          <NavLink to="/bot" className={navClass}>🤖 Rank & Rent Bot</NavLink>
          <NavLink to="/memory">🧠 Memory</NavLink>

        </nav>
        <main className="p-4 max-w-screen-xl mx-auto">
          <Routes>
            <Route path="/matrix" element={<Matrix />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/scraper" element={<Scraper />} />
            <Route path="/bot" element={<Bot />} />
            <Route path="/memory" element={<MemoryArchive />} />
            <Route path="*" element={<p>Select a tool from the navigation bar.</p>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
