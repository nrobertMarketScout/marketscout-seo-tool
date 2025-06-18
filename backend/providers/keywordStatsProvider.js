// backend/providers/keywordStatsProvider.js
import { getKeywordMetrics } from '../services/providers/DataForSEOProvider.js';

export async function getKeywordStats(keywords, locationCode) {
  try {
    return await getKeywordMetrics(keywords, locationCode);
  } catch (err) {
    console.error('❌ getKeywordStats failed:', err.message);
    return [];
  }
}
