import OpenAI from 'openai';

export class OpenAIEmbeddings {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async embedDocuments(texts) {
    const embeddings = await Promise.all(
      texts.map(async text => {
        const res = await this.client.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text
        });
        return res.data[0].embedding;
      })
    );
    return embeddings;
  }

  async embedQuery(text) {
    const res = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return res.data[0].embedding;
  }
}
