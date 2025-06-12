// backend/generator/index.js
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import buildSections from './steps/buildSections.js';

const ORIGIN = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

export default async function generateBundle(payload) {
  const { slug, indexPath } = await buildSections(payload);
  const dist = path.dirname(indexPath);

  /* assets (same as before) */
  const assetsDir = path.join(dist, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'styles.css'), '/* placeholder */');
  await fs.writeFile(path.join(assetsDir, 'main.js'),   'console.log("Site loaded");');

  /* zip (same) */
  const zipName = `${slug}.zip`;
  const zipPath = path.join(process.cwd(), 'uploads', zipName);
  const archive = archiver('zip', { zlib:{level:9} });
  const stream  = (await fs.open(zipPath, 'w')).createWriteStream();
  await new Promise((res,rej)=>
    archive.directory(dist,false).on('error',rej).pipe(stream).on('close',res) && archive.finalize());

  /* prepend origin so links hit backend, not Vite */
  return {
    success     : true,
    slug,
    downloadUrl : `${ORIGIN}/uploads/${zipName}`,
    previewUrl  : `${ORIGIN}/uploads/${slug}/index.html`,
    sourceUrl   : `${ORIGIN}/uploads/${slug}/index.html`
  };
}
