// backend/generator/steps/buildSections.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tplDir    = path.join(__dirname, '../templates')

// compile all four templates
const baseTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir,'base.hbs'),'utf8'))
const heroTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir,'hero.hbs'),'utf8'))
const servicesTpl = Handlebars.compile(await fs.readFile(path.join(tplDir,'services.hbs'),'utf8'))
const schemaTpl   = Handlebars.compile(await fs.readFile(path.join(tplDir,'schema.hbs'),'utf8'))

export default async function buildSections({ city, niche, hero, services, phone }) {
  // 1️⃣ build slug + output dir
  const slug = `${city}-${niche}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
  const dist = path.join(process.cwd(),'uploads',slug)
  await fs.mkdir(dist, { recursive: true })

  // 2️⃣ render hero
  const heroHtml = heroTpl({
    image:   hero.img     || '',
    heading: hero.heading || '',
    sub:     hero.sub     || ''
  })

  // 3️⃣ render services
  const servicesHtml = servicesTpl({
    services: services.map(s => ({ title: s }))
  })

  // 4️⃣ assemble body up to FEATURES placeholder
  //     (leave the <!--SCHEMA--> in base.hbs alone)
  const body = [
    heroHtml,
    '',
    servicesHtml,
    '',
    '<!--FEATURES-->'
  ].join('\n')

  // 5️⃣ wrap in base layout (base.hbs includes both placeholders)
  let html = baseTpl({
    title: `${niche} in ${city}`,
    body
  })

  // 6️⃣ compile schema JSON-LD
  const [locality, region = ''] = city.split(',').map(s=>s.trim())
  const businessName = `${niche} – ${city}`
  const pageUrl      = `http://localhost:3001/uploads/${slug}/index.html`
  const schemaHtml   = schemaTpl({
    businessName,
    city: `${locality}, ${region}`,
    state: region,
    niche,
    url: pageUrl,
    phone
  })

  // 7️⃣ inject schemaHtml into the single <!--SCHEMA--> marker
  html = html.replace('<!--SCHEMA-->', schemaHtml)

  // 8️⃣ write out index.html
  const indexPath = path.join(dist,'index.html')
  await fs.writeFile(indexPath, html, 'utf8')

  return { slug, indexPath }
}
