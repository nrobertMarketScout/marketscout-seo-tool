// backend/generator/index.js
import fs from 'fs/promises';
import path from 'path';
import fetchContent from './steps/fetchContent.js';

export default async function generateBundle(payload) {
  // 1. fetch competitor content + images
  const scraped = await fetchContent(payload);
  // 2. TODO: build sections & assemble HTML
  // 3. TODO: write assets, compress images, zip
  throw new Error('Not implemented – Ticket 3 sub-tasks will fill this');
}
