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
  const [rebuilding, setRebuilding] = useState(false);
  const [drawerOpen, setDrawer] = useState(false);
  const [tab, setTab] = useState('chat');
  const messagesEndRef = useRef(null);

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
        tags: res.tags ?? [],
        location: res.location ?? '',
        niches: res.niches ?? [],
        csv: res.csv ?? '',
        source: res.source ?? (isStructured ? 'structured_scrape' : 'vectorstore')
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

  const rebuildVectorstore = async () => {
    setRebuilding(true);
    try {
      const res = await fetch('/api/vectorstore/rebuild', { method: 'POST' });
      const json = await res.json();
      alert(json.message || '✅ Rebuild complete.');
    } catch (err) {
      alert('❌ Vectorstore rebuild failed.');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="flex h-screen text-gray-800">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 p-4 bg-gray-50 flex flex-col">
        <h1 className="text-xl font-bold mb-4 leading-snug">
          <span className="text-blue-900">Market</span>
          <span className="text-amber-600">Scout</span>
          <span className="block text-slate-500 italic text-sm mt-1">Assistant</span>
        </h1>

        <div className="space-y-2">
          <Button variant={tab === 'chat' ? 'default' : 'outline'} onClick={() => setTab('chat')} className="w-full">Chat</Button>
          <Button variant={tab === 'upload' ? 'default' : 'outline'} onClick={() => setTab('upload')} className="w-full">Upload</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)} className="w-full">View Memory</Button>
        </div>

        {tab === 'upload' && (
          <div className="mt-6 text-sm">
            <p className="font-semibold mb-2">Upload a file</p>
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
              className="text-xs mt-1"
            />
            <Button onClick={rebuildVectorstore} className="w-full mt-4 text-xs" variant="outline" disabled={rebuilding}>
              {rebuilding ? '♻️ Rebuilding...' : '♻️ Rebuild Knowledge Base'}
            </Button>
          </div>
        )}

        {tab === 'chat' && (
          <div className="mt-6 text-sm text-gray-500 italic">
            Session history coming soon...
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 bg-white h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className="max-w-[70%] shadow border border-gray-200">
                <CardContent className="p-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 text-right text-xs text-gray-500 space-y-1">
                      {msg.tags?.length > 0 && <div>🏷️ {msg.tags.join(', ')}</div>}
                      {msg.location && <div>📍 {msg.location}</div>}
                      {msg.niches?.length > 0 && <div>🧱 Niches: {msg.niches.join(', ')}</div>}
                      {msg.source && <div>📖 From: {msg.source}</div>}
                      <div className="space-x-2">
                        <button onClick={() => saveReply(msg)} className="text-indigo-600 hover:underline">Save</button>
                        {msg.csv && <a href={msg.csv} download className="text-blue-600 hover:underline">Download CSV</a>}
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
          <Button onClick={handleSend} disabled={loading} className="px-6">
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </div>

      <MemoryDrawer
        open={drawerOpen}
        onClose={() => setDrawer(false)}
        messages={savedMemory}
        onClear={clearMemory}
      />
    </div>
  );
}
