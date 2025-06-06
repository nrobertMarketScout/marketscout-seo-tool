// Bot.jsx (Enhanced with full Rank & Rent Expert integration)

import React, { useEffect, useState, useRef } from 'react';

const LOCAL_STORAGE_KEY = 'rankrent_chat_memory';

export default function Bot () {
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [examplesVisible, setExamplesVisible] = useState(true);
  const messagesEndRef = useRef(null);

  const exampleQuestions = [
    'What are the best niches in low-CPC areas?',
    'Summarize opportunities with low reviews and missing websites.',
    'Which city and service combos have < 3 Map Pack listings?',
    'What keyword-location pairs should I build next?',
    'Are there opportunities with low search volume but weak competition?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setExamplesVisible(false);

    try {
      const res = await fetch('http://localhost:11434/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg.text, history: messages })
      });
      const data = await res.json();
      const botMsg = { sender: 'bot', text: data.answer };
      const updated = [...messages, userMsg, botMsg];
      setMessages(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: '❌ Error fetching response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setExamplesVisible(true);
  };

  const handleExampleClick = (example) => {
    setInput(example);
    setExamplesVisible(false);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">🤖 Rank & Rent Expert</h1>
        <div className="space-x-2">
          <a href="#matrix" className="text-blue-600 hover:underline">📊 Matrix</a>
          <button onClick={resetChat} className="text-sm text-red-600 hover:underline">Reset</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`p-3 rounded-lg w-fit max-w-xl ${m.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-200'}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">🔄 Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {examplesVisible && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">💡 Try asking:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {exampleQuestions.map((q, i) => (
              <li key={i} className="cursor-pointer hover:underline" onClick={() => handleExampleClick(q)}>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Ask a question about keyword/location pairs, audit scores, etc."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm" disabled={loading}>
          Ask
        </button>
      </form>
    </div>
  );
}
