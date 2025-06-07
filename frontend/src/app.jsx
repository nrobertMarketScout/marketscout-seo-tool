import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Matrix from './pages/Matrix'
import Heatmap from './pages/Heatmap'
import Scraper from './pages/Scraper'
import Bot from './pages/Bot'
import Summary from './pages/Summary';
import MemoryArchive from './pages/MemoryArchive'

function App () {
  return (
    <div className="min-h-screen">
      <nav className="flex gap-4 p-4 shadow text-sm font-medium">
        <NavLink to="/matrix" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>📈 Matrix</NavLink>
        <NavLink to="/heatmap" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>🗺 Heatmap</NavLink>
        <NavLink to="/scraper" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>🛠 Scraper</NavLink>
        <NavLink to="/bot" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>🤖 Rank & Rent Bot</NavLink>
        <NavLink to="/memory" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>🧠 Memory</NavLink>
        <NavLink to="/summary" className={({ isActive }) => isActive ? 'text-blue-600 font-bold' : 'text-gray-700'}>📊 Summary</NavLink>
      </nav>
      <Routes>
        <Route path="/matrix" element={<Matrix />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/bot" element={<Bot />} />
        <Route path="/memory" element={<MemoryArchive />} />
      </Routes>
    </div>
  )
}

export default App
