// frontend/src/pages/Bot.jsx

import React, { useEffect, useState, useRef } from 'react';
import { askQuestion } from '../api/ask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const LOCAL_STORAGE_KEY = 'rankrent_chat_memory';
const MEMORY_KEY = 'rankrent_saved_memory';

export default function Bot () {
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [savedMemory, setSavedMemory] = useState(() => {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chat'); // chat | memory | upload
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
      const botMessage = {
        role: 'assistant',
        content:
          res.type === 'structured'
            ? res.summary
            : res.text || 'No answer returned.',
        tags: res.tags || [],
        location: res.location || '',
        niches: res.niches || [],
        csv: res.csv || ''
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error fetching response.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToMemory = (message) => {
    setSavedMemory(prev => [...prev, message]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleExportMemory = () => {
    const csv = savedMemory.map((msg, i) =>
      `"${i + 1}","${msg.content.replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([`"Index","Response"\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assistant_memory_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });
      alert('File uploaded and processed.');
    } catch (err) {
      alert('File upload failed.');
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <div className="w-72 border-r border-gray-200 p-4 bg-gray-50 flex flex-col">
        <div className="text-lg font-semibold mb-3">🧠 Assistant</div>
        <div className="space-y-2 mb-4">
          <Button variant={tab === 'chat' ? 'default' : 'outline'} onClick={() => setTab('chat')} className="w-full">💬 Chat</Button>
          <Button variant={tab === 'memory' ? 'default' : 'outline'} onClick={() => setTab('memory')} className="w-full">🧠 Memory</Button>
          <Button variant={tab === 'upload' ? 'default' : 'outline'} onClick={() => setTab('upload')} className="w-full">📁 Upload</Button>
          <Button variant="destructive" onClick={handleClearChat} className="w-full mt-1">🗑 Clear Chat</Button>
        </div>

        {tab === 'memory' && (
          <>
            <div className="text-sm font-semibold mb-2">Saved Responses</div>
            <div className="text-xs max-h-[40vh] overflow-auto space-y-2 pr-1">
              {savedMemory.map((m, i) => (
                <Card key={i}>
                  <CardContent className="p-2">{m.content}</CardContent>
                </Card>
              ))}
            </div>
            <Button variant="secondary" onClick={handleExportMemory} className="mt-3 text-sm">⬇️ Export</Button>
          </>
        )}

        {tab === 'upload' && (
          <>
            <div className="text-sm font-semibold mb-2">Upload a file</div>
            <Input type="file" accept=".csv,.pdf,.md" onChange={handleFileUpload} className="text-xs" />
            <div className="text-[11px] text-gray-500 mt-1">Supported: .csv, .pdf, .md</div>
          </>
        )}

        {tab === 'chat' && (
          <div className="mt-4 space-y-1 text-sm text-gray-700">
            {exampleQuestions.map((ex, i) => (
              <div key={i}>
                <button onClick={() => setInput(ex)} className="hover:underline text-blue-600">{ex}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className="max-w-[70%]">
                <CardContent className="p-3 whitespace-pre-wrap">
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 text-right text-xs text-gray-500 space-x-2">
                      <button onClick={() => handleSaveToMemory(msg)}>💾 Save</button>
                      {msg.csv && <a href={msg.csv} download className="text-blue-600">⬇️ CSV</a>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the assistant..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
