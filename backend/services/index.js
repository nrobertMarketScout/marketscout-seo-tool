import { KeywordService } from './KeywordService.js';
import { DataForSEOProvider } from './providers/DataForSEOProvider.js';

// Initialize KeywordService with DataForSEOProvider
export const keywordService = new KeywordService(
  new DataForSEOProvider(),
  new DataForSEOProvider()
);
