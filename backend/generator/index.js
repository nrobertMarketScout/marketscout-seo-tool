import buildSections from './steps/buildSections.js';

export default async function generateBundle(payload) {
  /* Step A – build index with hero + services */
  const { slug, indexPath } = await buildSections(payload);

  /* TODO Steps:
     B – competitor scrape & image compression
     C – write styles.css / main.js
     D – zip folder for download
  */

  return {
    slug,
    downloadUrl : `/api/site/download/${slug}.zip`,  // placeholder
    previewUrl  : `/uploads/${slug}/index.html`
  };
}
