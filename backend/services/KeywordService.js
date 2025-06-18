// backend/services/KeywordService.js
import axios from 'axios';

export class KeywordService {
  constructor(volumeProvider, serpProvider) {
    this.volumeProvider = volumeProvider;
    this.serpProvider = serpProvider;
  }

  async getLocationCode(locationName) {
    try {
      const res = await axios.get(`http://localhost:3001/api/locations/code`, {
        params: { name: locationName }
      });
      return res.data.location_code;
    } catch (err) {
      console.error(`❌ Failed to resolve location code for ${locationName}:`, err.message);
      return null;
    }
  }

  async getKeywordMetrics(keywords, locationName) {
    const locationCode = await this.getLocationCode(locationName);
    if (!locationCode) return [];

    return this.volumeProvider.getKeywordMetrics(keywords, locationCode);
  }

  async getSERPInsights(keyword, locationName) {
    const locationCode = await this.getLocationCode(locationName);
    if (!locationCode) return {};

    return this.serpProvider.getSERPInsights(keyword, locationCode);
  }
}
