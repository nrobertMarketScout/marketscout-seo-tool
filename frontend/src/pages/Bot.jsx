// frontend/src/pages/Bot.jsx
import React, { useEffect, useState, useRef } from 'react';
import { askQuestion } from '../api/ask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MemoryDrawer from '../components/MemoryDrawer';

const LOCAL_STORAGE_KEY = 'rankrent_chat_memory';
const MEMORY_KEY = 'rankrent_saved_memory';

export default function Bot () {
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]'));
  const [savedMemory, setSaved] = useState(() => JSON.parse(localStorage.getItem(MEMORY_KEY) || '[]'));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawer] = useState(false);
  const [tab, setTab] = useState('chat');
  const messagesEndRef = useRef(null);

  const exampleQuestions = [
    'What are the best niches in low-CPC areas?',
    'Summarize opportunities with low reviews and missing websites.',
    'Which city and service combos have < 3 Map Pack listings?',
    'What keyword-location pairs should I build next?',
    'What niche in Portland looks promising for lead gen?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(savedMemory));
  }, [savedMemory]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await askQuestion(input);
      const isStructured = res.type === 'structured';
      const botMessage = {
        role: 'assistant',
        content: isStructured ? res.summary : res.text || 'No answer returned.',
        tags: res.tags || [],
        location: res.location || '',
        niches: res.niches || [],
        csv: res.csv || '',
        source: res.source || ''
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error fetching response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const saveReply = (msg) => setSaved(prev => [...prev, msg]);
  const clearMemory = () => {
    setSaved([]);
    localStorage.removeItem(MEMORY_KEY);
  };

  return (
    <div className="flex h-screen text-gray-800">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 p-4 bg-gray-50 flex flex-col">
        <div className="text-lg font-semibold mb-3">🧠 Assistant</div>
        <div className="space-y-2 mb-4">
          <Button variant={tab === 'chat' ? 'default' : 'outline'} onClick={() => setTab('chat')} className="w-full">💬 Chat</Button>
          <Button variant={tab === 'upload' ? 'default' : 'outline'} onClick={() => setTab('upload')} className="w-full">📁 Upload</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)} className="w-full">🧠 View Memory</Button>
        </div>
        {tab === 'upload' && (
          <>
            <div className="text-sm font-semibold mb-2">Upload a file</div>
            <Input
              type="file"
              accept=".csv,.pdf,.md"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                try {
                  await fetch('/api/ingest', { method: 'POST', body: formData });
                  alert('File uploaded and processed.');
                } catch {
                  alert('File upload failed.');
                }
              }}
              className="text-xs"
            />
            <div className="text-[11px] text-gray-500 mt-1">Supported: .csv, .pdf, .md</div>
          </>
        )}
        {tab === 'chat' && (
          <div className="mt-4 space-y-1 text-sm text-gray-700">
            {exampleQuestions.map((ex) => (
              <div key={ex}>
                <button onClick={() => setInput(ex)} className="hover:underline text-blue-600">{ex}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-white h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className="max-w-[70%]">
                <CardContent className="p-3 whitespace-pre-wrap">
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 text-right text-xs text-gray-500 space-y-1">
                      {msg.tags?.length > 0 && <div>🏷️ {msg.tags.join(', ')}</div>}
                      {msg.location && <div>📍 {msg.location}</div>}
                      {msg.niches?.length > 0 && <div>🧱 Niches: {msg.niches.join(', ')}</div>}
                      {msg.source && <div>📖 From: {msg.source}</div>}
                      <div className="space-x-2">
                        <button onClick={() => saveReply(msg)}>💾 Save</button>
                        {msg.csv && <a href={msg.csv} download className="text-blue-600">⬇️ CSV</a>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the assistant..."
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </div>

      {/* Memory drawer */}
      <MemoryDrawer
        open={drawerOpen}
        onClose={() => setDrawer(false)}
        messages={savedMemory}
        onClear={clearMemory}
      />
    </div>
  );
}
