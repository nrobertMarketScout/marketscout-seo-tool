export class KeywordService {
  constructor(volumeProvider, serpProvider) {
    this.volumeProvider = volumeProvider;
    this.serpProvider = serpProvider;
  }

  async getKeywordMetrics(keywords, location) {
    return this.volumeProvider.getKeywordMetrics(keywords, location);
  }

  async getSERPInsights(keyword, location) {
    return this.serpProvider.getSERPInsights(keyword, location);
  }
}
