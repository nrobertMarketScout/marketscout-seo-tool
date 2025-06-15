import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Matrix () {
  const [data, setData] = useState([])
  const [serpData, setSerpData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const keywords = ['plumber', 'electrician', 'hvac']
  const location = 'Portland,OR'

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)

        const metricsRes = await axios.get('/api/dataforseo/keyword-data', {
          params: { keywords: keywords.join(','), location }
        })

        const serpRes = await axios.get('/api/dataforseo/serp-insights', {
          params: { keyword: keywords[0], location }
        })

        setData(metricsRes.data)
        setSerpData(serpRes.data)

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) return <div>Loading data...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Keyword Metrics for {location}</h1>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Volume</th>
            <th>CPC</th>
            <th>Competition</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, idx) => (
            <tr key={idx}>
              <td>{d.keyword}</td>
              <td>{d.search_volume}</td>
              <td>${d.cpc}</td>
              <td>{d.competition}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>SERP Insights for "{keywords[0]}"</h2>
      <p>Local Pack: {serpData.hasLocalPack ? '✅' : '❌'}</p>
      <ul>
        {serpData.organicResults.slice(0, 5).map((r, idx) => (
          <li key={idx}>
            <a href={r.url}>{r.title}</a>
            <p>{r.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
