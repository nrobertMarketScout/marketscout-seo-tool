import { NavLink } from 'react-router-dom';

export default function SideNav () {
  const linkStyle = ({ isActive }) =>
    `block mb-2 rounded-lg px-6 py-3 text-sm font-medium transition
     ${isActive ? 'bg-white/20 text-white'
      : 'text-white/80 hover:text-white hover:bg-white/10'}`;

  return (
    <aside className="w-56 min-h-screen bg-gradient-to-b from-[#0028d4] to-[#0040ff] shadow-lg shadow-black/30 p-4">
      <h2 className="mb-6 px-2 text-lg font-bold text-white">MarketScout</h2>
      <nav>
        <NavLink to="/matrix" className={linkStyle}>📈 Matrix</NavLink>
        <NavLink to="/heatmap" className={linkStyle}>🗺 Heatmap</NavLink>
        <NavLink to="/scraper" className={linkStyle}>🛠 Scraper</NavLink>
        <NavLink to="/bot" className={linkStyle}>🤖 Assistant</NavLink>
        <NavLink to="/site-builder" className={linkStyle}>📐 Site Builder</NavLink>
        <NavLink to="/summary" className={linkStyle}>📊 Summary</NavLink>
      </nav>
    </aside>
  );
}
