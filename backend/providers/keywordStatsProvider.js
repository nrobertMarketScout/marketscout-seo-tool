// backend/services/providers/keywordStatsProvider.js
import { DataForSEOProvider } from './DataForSEOProvider.js';

const dataProvider = new DataForSEOProvider();

export async function getKeywordStats(keywords, locationCode) {
  try {
    return await dataProvider.getKeywordMetrics(keywords, locationCode);
  } catch (err) {
    console.error('❌ getKeywordStats failed:', err.message);
    return [];
  }
}
