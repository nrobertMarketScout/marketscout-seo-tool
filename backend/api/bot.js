// backend/api/bot.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { OpenAI } from 'openai';
import { fetchMapsResults } from '../lib/serpapi_client.js';
import { auditAndScore } from '../lib/audit_and_score.js';
import { loadRetriever } from '../vectorstore/retriever.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SERVICES_CSV = path.join(process.cwd(), 'services_list.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'combined_opportunity_matrix.csv');
const INPUT_CSV_PATH = path.join(process.cwd(), 'data', 'input.csv');

router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    // Load known services
    const raw = await fs.readFile(SERVICES_CSV, 'utf-8');
    const services = raw.split('\n').map(line => line.trim()).filter(Boolean);

    // Try to extract location + niches
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a niche matching engine for a rank & rent SEO platform.
Extract the U.S. city and all matching services from the provided list of known niches.
Match only exact or partial terms from the list — do not generate new services.
Respond using the function format provided.`
        },
        {
          role: 'user',
          content: `Query: ${question}\n\nValid niches:\n${services.join(', ')}`
        }
      ],
      functions: [{
        name: 'set_location_and_niches',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            niches: { type: 'array', items: { type: 'string' } }
          },
          required: ['location', 'niches']
        }
      }],
      function_call: { name: 'set_location_and_niches' }
    });

    const parsed = JSON.parse(chat.choices[0].message.function_call.arguments || '{}');
    const { location, niches } = parsed;

    if (location && niches?.length) {
      // Save input.csv
      const inputCSV = [
        'Group,Keyword,Location',
        ...niches.map(niche => `"${niche}","${niche} ${location}","${location}"`)
      ].join('\n');
      await fs.writeFile(INPUT_CSV_PATH, inputCSV);

      // Scrape loop
      const allResults = [];
      for (const niche of niches) {
        const keyword = `${niche} ${location}`;
        const results = await fetchMapsResults(keyword, location);

        for (const r of results) {
          allResults.push({
            Group: niche,
            Keyword: keyword,
            Location: location,
            Name: r.title || '',
            Rating: r.rating || '',
            Reviews: r.rating_total || '',
            Address: r.address || '',
            Phone: r.phone_number || '',
            PlaceId: r.place_id || '',
            Website: r.website || '',
            Latitude: r.gps_coordinates?.latitude ?? '',
            Longitude: r.gps_coordinates?.longitude ?? ''
          });
        }
      }

      if (allResults.length === 0) {
        return res.json({
          text: '⚠️ No data could be scraped — likely hit SerpAPI free tier quota. Try again later.'
        });
      }

      // Score & save
      const summary = auditAndScore(allResults);
      const scoreMap = {};
      for (const row of summary) {
        scoreMap[`${row.Keyword}::${row.Location}`] = row.OpportunityScore;
      }

      const finalResults = allResults.map(entry => ({
        ...entry,
        'Opportunity Score': scoreMap[`${entry.Keyword}::${entry.Location}`] || 0
      }));

      const topResults = finalResults
        .sort((a, b) => b['Opportunity Score'] - a['Opportunity Score'])
        .slice(0, 10);

      const uniqueNiches = [...new Set(topResults.map(r => r.Group))];
      await fs.writeFile(OUTPUT_CSV, Papa.unparse(finalResults, { quotes: true }));

      return res.json({
        summary: `Top niches in ${location}: ${uniqueNiches.join(', ')}`,
        location,
        niches,
        csv: '/data/combined_opportunity_matrix.csv'
      });
    }

    // ❗ Fallback: Use vectorstore retrieval
    const retriever = await loadRetriever();
    const docs = await retriever.getRelevantDocuments(question);
    const injected = docs.map(d => d.pageContent).slice(0, 3).join('\n\n');

    const fallback = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: `You are an expert rank & rent assistant. Use the following knowledge base:\n\n${injected}` },
        { role: 'user', content: question }
      ]
    });

    const answer = fallback.choices?.[0]?.message?.content?.trim() || 'No answer found.';
    return res.json({ text: answer });
  } catch (err) {
    console.error('❌ /api/bot error:', err);
    res.status(500).json({ error: 'Failed to process bot request.' });
  }
});

export default router;
