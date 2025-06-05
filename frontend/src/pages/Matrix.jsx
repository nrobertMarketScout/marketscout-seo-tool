// frontend/src/pages/Matrix.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Matrix() {
  const [matrix, setMatrix] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('/api/matrix')
      .then(res => setMatrix(res.data.matrix || []))
      .catch(() => setError('Unable to load matrix data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading opportunity matrix...</p>
  if (error) return <p className='text-red-600'>{error}</p>
  if (!matrix.length) return <p>No matrix data found.</p>

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>📈 Opportunity Matrix</h2>
      <div className='overflow-auto'>
        <table className='min-w-full table-auto border text-sm'>
          <thead className='bg-gray-100'>
            <tr>
              {Object.keys(matrix[0]).map((header, i) => (
                <th
                  key={i}
                  className='px-2 py-1 border text-left whitespace-nowrap'
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i} className='border-t'>
                {Object.values(row).map((value, j) => (
                  <td
                    key={j}
                    className={`px-2 py-1 border ${
                      typeof value === 'number' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
