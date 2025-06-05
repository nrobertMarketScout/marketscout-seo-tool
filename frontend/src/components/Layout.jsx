// frontend/src/components/Layout.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Summary', path: '/summary' },
  { name: 'Matrix', path: '/matrix' },
  { name: 'Heatmap', path: '/heatmap' },
  { name: 'Scraper', path: '/scraper' },
  { name: 'Bot', path: '/bot' },
  { name: 'Estimator', path: '/estimator' }
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">MarketScout</h1>
        <nav className="space-x-4">
          {navItems.map(({ name, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}
            >
              {name}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
