import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

const MemoryArchiveViewer = () => {
  const [archives, setArchives] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const res = await fetch('http://localhost:3001/memory-archive')
        const data = await res.json()
        setArchives(data.reverse())
      } catch (err) {
        console.error('Error fetching memory archive:', err)
      }
    }

    fetchArchives()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">🧠 Memory Archive Viewer</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScrollArea className="h-[600px] p-2 border rounded">
          <ul className="space-y-2">
            {archives.map((entry, i) => (
              <li key={i}>
                <Button
                  variant={selected === i ? 'default' : 'outline'}
                  className="w-full justify-start text-left"
                  onClick={() => setSelected(i)}
                >
                  {new Date(entry.timestamp).toLocaleString()} — {entry.question.slice(0, 50)}...
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>

        <div className="md:col-span-2 border rounded p-4 min-h-[600px] overflow-y-auto">
          {selected !== null ? (
            <>
              <h3 className="text-xl font-semibold mb-2">{archives[selected].question}</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {archives[selected].response}
              </pre>
            </>
          ) : (
            <p className="text-gray-500 italic">Select a memory from the left to view its details.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemoryArchiveViewer
