import {imageURL} from './shared.js';
export const postsQuery='*[_type == "post" && defined(slug.current)] | order(publishedAt desc){_id,title,slug,category,excerpt,publishedAt,cover,body}';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validSlug=value=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value||'');
export const postPath=post=>'/blog/'+post.slug.current+'/';
export const dateLabel=value=>Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',timeZone:'Pacific/Auckland'}).format(new Date(value)):'';
const safeLink=value=>typeof value==='string' && (/^https?:\/\//i.test(value)||/^mailto:[^\s]+$/i.test(value))?value:null;
export function renderBody(blocks,config){
 let html='',list=null;
 const close=()=>{if(list){html+='</'+list+'>';list=null;}};
 for(const block of blocks||[]){
  if(block._type==='image'){close();const url=imageURL(block,config);if(url)html+='<figure><img src="'+escapeHTML(url)+'" alt="'+escapeHTML(block.alt)+'" loading="lazy">'+(block.caption?'<figcaption>'+escapeHTML(block.caption)+'</figcaption>':'')+'</figure>';continue;}
  if(block._type!=='block')continue;
  const text=(block.children||[]).map(span=>{let value=escapeHTML(span.text).replace(/\n/g,'<br>');for(const mark of span.marks||[]){if(['strong','em'].includes(mark))value='<'+mark+'>'+value+'</'+mark+'>';else{const def=block.markDefs?.find(d=>d._key===mark);const url=safeLink(def?.href);if(url)value='<a href="'+escapeHTML(url)+'" rel="noopener noreferrer">'+value+'</a>';}}return value;}).join('');
  const next=block.listItem==='bullet'?'ul':block.listItem==='number'?'ol':null;
  if(next){if(list!==next){close();list=next;html+='<'+next+'>';}html+='<li>'+text+'</li>';}
  else{close();const tag=['h2','h3','blockquote'].includes(block.style)?block.style:'p';html+='<'+tag+'>'+text+'</'+tag+'>';}
 }close();return html;
}
export function renderPostCards(posts,config,home=false){
 if(!posts.length)return '<p class="blog-empty">'+(home?'Stories from the academy will appear here soon.':'No articles published yet. Check back soon.')+'</p>';
 return posts.map((p,i)=>{const url=imageURL(p.cover,config);return '<article data-category="'+escapeHTML(p.category)+'" class="'+(home?'post':'journal-card'+(i===0?' journal-card--feature':''))+'">'+(url?'<'+(home?'div class="post-img"':'figure')+'><img style="width:100%;height:100%;object-fit:cover" src="'+escapeHTML(url)+'" alt="'+escapeHTML(p.cover.alt)+'" loading="lazy"></'+(home?'div':'figure')+'>':'')+'<div class="'+(home?'post-body':'journal-card-body')+'"><div class="journal-meta"><span class="post-tag">'+escapeHTML(p.category)+'</span> <span class="post-date">'+dateLabel(p.publishedAt)+'</span></div><h3><a href="'+postPath(p)+'">'+escapeHTML(p.title)+'</a></h3><p>'+escapeHTML(p.excerpt)+'</p><a class="post-more" href="'+postPath(p)+'" aria-label="Read '+escapeHTML(p.title)+'">Read article &rarr;</a></div></article>';}).join('');
}
export function renderPostPage(post,config,shell={}){
 const e=escapeHTML,url=imageURL(post.cover,config);
 const words=(post.body||[]).flatMap(block=>block.children||[]).map(span=>span.text||'').join(' ').trim().split(/\s+/).filter(Boolean).length;
 const minutes=Math.max(1,Math.ceil(words/220));
 return `<!doctype html><html lang="en-NZ"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(post.title)} | Carlson Gracie NZ</title><meta name="description" content="${e(post.excerpt)}"><meta property="og:type" content="article"><meta property="og:title" content="${e(post.title)}"><meta property="og:description" content="${e(post.excerpt)}">${url?`<meta property="og:image" content="${e(url)}">`:''}${shell.head||''}</head><body class="blog-page blog-article-page">${shell.nav||''}<main id="main-content"><header class="article-hero"><div class="wrap"><a class="article-back" href="/blog/">← Back to the journal</a><div class="article-meta"><span>${e(post.category)}</span><span>${dateLabel(post.publishedAt)}</span><span>${minutes} min read</span></div><div class="article-heading"><h1 class="display">${e(post.title)}</h1><p class="article-summary">${e(post.excerpt)}</p></div></div></header>${url?`<figure class="article-cover"><img src="${e(url)}" alt="${e(post.cover.alt)}" fetchpriority="high">${post.cover.caption?`<figcaption>${e(post.cover.caption)}</figcaption>`:''}</figure>`:''}<div class="article-layout wrap"><aside class="article-side"><p class="eyebrow">From the academy</p><p>Carlson Gracie<br>New Zealand</p><a href="/blog/">All stories ↗</a></aside><article class="article-body">${renderBody(post.body,config)}</article></div><section class="article-onward"><div class="wrap"><div><p class="eyebrow">Your next chapter</p><h2 class="display">See you on<br>the mats.</h2></div><div><p>Find your academy, meet the team and take your first step onto the mat.</p><a class="btn btn-red" href="/locations/">Find an academy ↗</a><a class="article-back" href="/blog/">Explore more stories →</a></div></div></section></main>${shell.footer||''}${shell.scripts||''}</body></html>`;
}
