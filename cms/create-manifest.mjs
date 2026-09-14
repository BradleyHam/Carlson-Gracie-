import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const root = process.cwd();
if (fs.existsSync('cms/manifest.json') && !process.argv.includes('--replace')) throw new Error('Manifest exists. Do not replace after content has been imported; migrate bindings deliberately.');
const folders = ['about','contact','faq','locations','membership','privacy','seminars','terms','training'];
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : e.name === 'index.html' ? [path.join(dir,e.name)] : []); }
const files = ['index.html', ...folders.flatMap(walk)].filter(f => f !== 'training/timetable/index.html');
const key = value => createHash('sha256').update(value).digest('hex').slice(0,16);
function selector(el) {
  const parts=[];
  while(el?.type === 'tag') {
    const peers = el.parent.children.filter(n => n.type === 'tag' && n.name === el.name);
    parts.unshift(el.name + ':nth-of-type(' + (peers.indexOf(el)+1) + ')'); el=el.parent;
  }
  return parts.join(' > ');
}
const excluded = 'nav,footer,script,style,template,form,[role="navigation"],#timetable,[class*="timetable"],.tt-grid,.tt-col,.section-index,.mobile-section-nav,.onward-nav,.sticky-cta,[data-featured-event],[data-upcoming-list],[data-past-list],.hero-proof,.cta-proof,#reviews,.stars';
const pages = files.map(file => {
  const $ = load(fs.readFileSync(file,'utf8'));
  const sections = new Map();
  const route = file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, '');
  function group(el) {
    const container = $(el).closest('section,header,main').get(0) || $('body').get(0);
    const id = key(file + selector(container));
    if (!sections.has(id)) {
      const label = $(container).find('h1,h2').first().text().replace(/\s+/g,' ').trim() || 'Page introduction';
      sections.set(id,{_key:id,_type:'pageSection',label:label.slice(0,120),texts:[],images:[]});
    }
    return sections.get(id);
  }
  $('h1,h2,h3,h4,p,summary,figcaption,blockquote,.cms,.hero-deco .l').each((i,el) => {
    const node=$(el);
    if (node.closest(excluded).length || !node.closest('body').length || node.find('*').not('br').length) return;
    const value = node.text().replace(/\s+/g,' ').trim();
    if (!value || value.length < 2) return;
    const binding=selector(el);
    const type = /^h[1-4]$/.test(el.name) ? 'Heading' : el.name === 'summary' ? 'Question' : 'Text';
    group(el).texts.push({_key:key(file+binding),_type:'pageText',label:type + ': ' + value.slice(0,85),value,selector:binding});
  });
  $('img').each((i,el) => {
    const node=$(el);
    if(node.closest(excluded).length || node.closest('picture').length || node.attr('srcset')) return;
    const src=node.attr('src'); if(!src || /logo|crest|webclip/.test(src)) return;
    const binding=selector(el);
    group(el).images.push({_key:key(file+binding),_type:'pageImage',label:node.attr('alt') || 'Section photo',alt:node.attr('alt') || '',originalSrc:src,selector:binding});
  });
  return {_id:'page-' + (route==='/' ? 'home' : route.slice(1,-1).replaceAll('/','-')),_type:'sitePage',title:route === '/' ? 'Home' : route.slice(1,-1).split('/').map(s=>s.replaceAll('-',' ')).join(' / '),route,file,seoTitle:$('title').text(),seoDescription:$('meta[name="description"]').attr('content') || '',sections:[...sections.values()]};
});
fs.writeFileSync('cms/manifest.json',JSON.stringify(pages,null,2)+'\n');
const seeds=pages.map(({file,...page})=>({...page,sections:page.sections.map(section=>({...section,texts:section.texts.map(({selector,...item})=>item),images:section.images.map(({selector,...item})=>item)}))}));
fs.writeFileSync('cms/seed.ndjson',seeds.map(p=>JSON.stringify(p)).join('\n')+'\n');
console.log({pages:pages.length,textFields:pages.reduce((n,p)=>n+p.sections.reduce((n,s)=>n+s.texts.length,0),0),images:pages.reduce((n,p)=>n+p.sections.reduce((n,s)=>n+s.images.length,0),0),timetableIncluded:false});
