import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const auth = {
  username: process.env.DATAFORSEO_LOGIN,
  password: process.env.DATAFORSEO_PASSWORD,
};

export class DataForSEOProvider {
  async getKeywordMetrics(keywords, location) {
    const payload = keywords.map(keyword => ({
      keyword,
      location_name: location,
      language_code: "en"
    }));

    const { data } = await axios.post(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      payload,
      { auth }
    );

    return data.tasks.map(task => ({
      keyword: task.data.keyword,
      search_volume: task.result.search_volume,
      cpc: task.result.cpc,
      competition: task.result.competition
    }));
  }

  async getSERPInsights(keyword, location) {
    const payload = [{
      keyword,
      location_name: location,
      language_code: "en",
      depth: 20
    }];

    const { data } = await axios.post(
      'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
      payload,
      { auth }
    );

    const results = data.tasks[0].result[0].items;
    return {
      hasLocalPack: results.some(item => item.type === "local_pack"),
      organicResults: results.filter(item => item.type === "organic").map(item => ({
        title: item.title,
        url: item.url,
        snippet: item.snippet
      })),
    };
  }
}
