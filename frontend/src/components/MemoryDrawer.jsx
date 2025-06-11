import React from 'react';

export default function MemoryDrawer ({ open, onClose, messages, onClear }) {
  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 z-40
      ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Memory</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
      </div>
      <div className="p-4 overflow-y-auto space-y-4">
        {messages.length === 0
          ? <p className="text-sm text-gray-500">No saved replies yet.</p>
          : messages.map((m, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">{m.content}</div>
          ))}
      </div>
      <div className="p-4 border-t">
        <button onClick={onClear} className="w-full px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium shadow hover:bg-red-700">
          Clear Memory
        </button>
      </div>
    </div>
  );
}
