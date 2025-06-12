/* eslint-disable camelcase */
import { OpenAI } from 'openai';

export default async function SiteContentChain({
  city,
  niche,
  competitors = '',
  phone,
  writingStyle,
  pageType // index | services | about | contact
}) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ---------- 1 · Prompt ---------------------------------------------------
  const system = `
You are an expert copy-writer and web designer. Generate concise, ${writingStyle} HTML **body only** (no <style> or <script>)
for a modern local-service website built with Tailwind CSS.  Use semantic tags (header, section, footer).
Return JSON: { body_html, hero_heading, hero_sub, cta_text }.
• index: include hero banner, services grid (3 items), testimonials placeholder, CTA strip
• services: H1 + bullet list of top services
• about: 200-word about section + values list
• contact: address placeholder + phone + simple contact paragraph
`;

  const user = `
City: ${city}
Service niche: ${niche}
Page type: ${pageType}
Phone: ${phone || 'N/A'}
Competitor notes (optional): ${competitors}
`;

  const tools = [{
    type: 'function',
    function: {
      name: 'generate_site_page',
      parameters: {
        type: 'object',
        properties: {
          body_html     : { type: 'string' },
          hero_heading  : { type: 'string' },
          hero_sub      : { type: 'string' },
          cta_text      : { type: 'string' }
        },
        required: ['body_html']
      }
    }
  }];

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system.trim() },
      { role: 'user',   content: user.trim() }
    ],
    tools,
    tool_choice: { type: 'function', function: { name: 'generate_site_page' } },
    temperature: 0.6
  });

  const out = JSON.parse(res.choices[0].message.tool_calls[0].function.arguments);

  // ---------- 2 · Wrap with skeleton --------------------------------------
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${out.hero_heading || niche} in ${city}</title>
  <meta name="description" content="${out.hero_sub || niche + ' services in ' + city}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="font-sans text-gray-800 bg-gray-50">
  ${out.body_html}
  <footer class="text-center py-10 text-sm text-gray-500">© ${new Date().getFullYear()} ${niche} in ${city}</footer>
</body>
</html>
`;
}
