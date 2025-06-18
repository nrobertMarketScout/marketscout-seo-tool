// backend/api/bot.js
import express from 'express';
import fs from 'fs/promises';
import Papa from 'papaparse';
import { OpenAI } from 'openai';
import { fetchSERPFromDataForSEO } from '../lib/dataforseo_client.js';
import { auditAndScore } from '../lib/audit_and_score.js';
import { getRelevantChunks } from '../utils/embeddings.js';
import { loadRetriever } from '../vectorstore/retriever.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SERVICES_CSV = path.join(process.cwd(), 'services_list.csv');
const CITIES_CSV = path.join(process.cwd(), 'US_City_Population_Data__Cleaned_.csv');
const OUTPUT_CSV = path.join(process.cwd(), 'combined_opportunity_matrix.csv');
const INPUT_CSV_PATH = path.join(process.cwd(), 'data', 'input.csv');

async function loadListFromCSV(csvPath) {
  try {
    const raw = await fs.readFile(csvPath, 'utf-8');
    return raw.split('\n').map(line => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    // Step 1: Try cache-backed embedding chunks
    let injectedChunks = [];
    try {
      injectedChunks = await getRelevantChunks(question, 4);
    } catch (err) {
      console.warn('⚠️ getRelevantChunks failed:', err.message);
    }

    // Step 2: Fallback to LangChain retriever if chunks not found
    if (injectedChunks.length === 0) {
      try {
        const retriever = await loadRetriever();
        const docs = await retriever.getRelevantDocuments(question);
        injectedChunks = docs.map(d => ({ text: d.pageContent, metadata: d.metadata || {} }));
      } catch (err) {
        console.warn('⚠️ FAISS retriever failed:', err.message);
      }
    }

    // Step 3: Inject into GPT prompt if found
    if (injectedChunks.length > 0) {
      const formatted = injectedChunks
        .map((d, i) => `(${i + 1}) ${d.text.trim()}`)
        .join('\n\n');

      const answer = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a rank & rent SEO expert. Use these retrieved notes to answer the question:\n\n${formatted}`
          },
          { role: 'user', content: question }
        ]
      });

      const responseText = answer.choices?.[0]?.message?.content?.trim();
      const tags = injectedChunks.flatMap(d => {
        const src = d.metadata?.file || d.metadata?.source;
        return src ? [src] : [];
      });

      if (responseText) {
        return res.json({
          text: responseText,
          source: tags[0] || '',
          tags: tags
        });
      }
    }

    // Step 4: If not a KB question, try structured scrape inference
    const [services, cities] = await Promise.all([
      loadListFromCSV(SERVICES_CSV),
      loadListFromCSV(CITIES_CSV)
    ]);

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a fuzzy matcher for a rank & rent SEO tool. Match ONLY U.S. cities and known service niches from provided lists. Do not invent services or locations.`
        },
        {
          role: 'user',
          content: `Query: ${question}\n\nCities: ${cities.join(', ')}\nServices: ${services.join(', ')}`
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
      const inputCSV = [
        'Group,Keyword,Location',
        ...niches.map(niche => `"${niche}","${niche} ${location}","${location}"`)
      ].join('\n');
      await fs.writeFile(INPUT_CSV_PATH, inputCSV);

      const allResults = [];
      for (const niche of niches) {
        const keyword = `${niche} ${location}`;
        const results = await fetchSERPFromDataForSEO(keyword, location);
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
          text: '⚠️ No data could be scraped — possibly hit DataForSEO quota or bad keywords.'
        });
      }

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
        type: 'structured',
        summary: `Top niches in ${location}: ${uniqueNiches.join(', ')}`,
        location,
        niches,
        csv: '/data/combined_opportunity_matrix.csv'
      });
    }

    return res.json({ text: '❌ Could not extract valid location and services from your query.' });
  } catch (err) {
    console.error('❌ /api/bot error:', err);
    res.status(500).json({ error: 'Failed to process bot request.' });
  }
});

export default router;
