// backend/generator/steps/buildSections.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tplDir    = path.join(__dirname, '../templates')

// compile our three fragments
const baseTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir,'base.hbs'),'utf8'))
const heroTpl     = Handlebars.compile(await fs.readFile(path.join(tplDir,'hero.hbs'),'utf8'))
const servicesTpl = Handlebars.compile(await fs.readFile(path.join(tplDir,'services.hbs'),'utf8'))

export default async function buildSections({ city, niche, hero, services }) {
  const slug = `${city}-${niche}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
  const dist = path.join(process.cwd(),'uploads',slug)
  await fs.mkdir(dist,{recursive:true})

  const heroHtml = heroTpl({
    image:   hero.img||'',
    heading: hero.heading||'',
    sub:     hero.sub||''
  })

  const servicesHtml = servicesTpl({
    services: services.map(s=>({title:s}))
  })

  // Here are **exactly one** of each placeholder for injection later
  const body = [
    heroHtml,
    '',
    servicesHtml,
    '',
    '<!--FEATURES-->',
    '',
    '<!--SCHEMA-->'
  ].join('\n')

  const html = baseTpl({ title:`${niche} in ${city}`, body })
  const indexPath = path.join(dist,'index.html')
  await fs.writeFile(indexPath,html,'utf8')
  return { slug, indexPath }
}
