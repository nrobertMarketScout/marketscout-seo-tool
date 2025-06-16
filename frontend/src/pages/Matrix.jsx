// frontend/src/pages/Matrix.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Matrix () {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await axios.get('/api/matrix')
        setRows(res.data.matrix || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMatrix()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>📊 Opportunity Matrix</h2>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Location</th>
            <th>Volume</th>
            <th>CPC</th>
            <th>Competition</th>
            <th>Map Pack</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.Keyword}</td>
              <td>{row.Location}</td>
              <td>{row.Volume}</td>
              <td>${row.CPC}</td>
              <td>{row.Competition}</td>
              <td>{row['Map Pack'] === '1' ? '✅' : '❌'}</td>
              <td>{row.Score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
