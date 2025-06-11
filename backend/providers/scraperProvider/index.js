// Unified scraper facade. Switch via env: SCRAPER_PROVIDER=serpapi|phantombuster
import serpapiScraper     from './serpapiScraper.js';
import phantomScraper     from './phantomScraper.js';

const provider = process.env.SCRAPER_PROVIDER || 'serpapi';

export const scrape = async (keyword, location) => {
  switch (provider) {
    case 'phantombuster': return phantomScraper(keyword, location);
    default            : return serpapiScraper(keyword, location);
  }
};
