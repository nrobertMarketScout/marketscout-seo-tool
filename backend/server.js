// backend/server.js
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

app.use('/api/bot', require('./api/bot'))
app.use('/api/scrape', require('./api/scrape'))
app.use('/api/matrix', require('./api/matrix'))
app.use('/api/summary', require('./api/summary'))
app.use('/api/heatmap', require('./api/heatmap'))
app.use('/api/estimator', require('./api/estimator'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
})
