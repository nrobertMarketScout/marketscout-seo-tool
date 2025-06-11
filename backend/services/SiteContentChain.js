// backend/services/SiteContentChain.js
/* eslint-disable camelcase */
import { OpenAI } from 'openai';   // ← match existing server.js import

/**
 * Stub until FAISS/LangChain are wired up.
 * Returns an empty context array.
 */
async function retrieveContext() {
  return [];
}

export default async function SiteContentChain({
  city,
  niche,
  competitors = '',
  phone,
  writingStyle
}) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const contextSnippets = await retrieveContext();

  const systemPrompt = `
You are an expert copywriter. Write concise, ${writingStyle} local-service landing-page copy.
Return JSON with keys: seo_title, meta_description, heading, intro_section.
`;

  const userPrompt = `
City: ${city}
Niche: ${niche}
Phone: ${phone || 'N/A'}
Competitor notes: ${competitors}
Context snippets:\n${contextSnippets.join('\n')}
`;

  // Define function-call schema for structured output
  const tools = [{
    type: 'function',
    function: {
      name: 'generate_site_content',
      parameters: {
        type: 'object',
        properties: {
          seo_title       : { type: 'string', description: '<=60 chars' },
          meta_description: { type: 'string', description: '<=160 chars' },
          heading         : { type: 'string' },
          intro_section   : { type: 'string' }
        },
        required: ['seo_title', 'meta_description', 'heading', 'intro_section']
      }
    }
  }];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user',   content: userPrompt.trim() }
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'generate_site_content' } },
    temperature: 0.7
  });

  // Parse JSON from function call
  const args = response.choices[0].message.tool_calls[0].function.arguments;
  return JSON.parse(args);
}
