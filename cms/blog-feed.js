import {renderPostCards,escapeHTML,dateLabel} from './posts.js';
import {imageURL} from './shared.js';

export function renderBlogFeed(posts,events,config){
 const covered=new Set(posts.map(p=>imageURL(p.cover,config)?.split('?')[0]).filter(Boolean));
 const cards=events.filter(e=>e.title && Number.isFinite(Date.parse(e.startsAt)) && !(e.image && covered.has(e.image.split('?')[0]))).map(e=>{
  const category=e.category==='Seminar'?'Seminars':'Events';
  const image=/^https:\/\/cdn\.sanity\.io\/images\//.test(e.image||'')?'<figure><img src="'+escapeHTML(e.image)+'" alt="'+escapeHTML(e.imageAlt||e.title)+'" loading="lazy"></figure>':'';
  return '<article class="journal-card journal-event" data-category="'+category+'">'+image+'<div class="journal-card-body"><div class="journal-meta"><span class="post-tag">'+category+'</span><span>'+escapeHTML(dateLabel(e.startsAt))+'</span></div><h3><a href="/seminars/events/">'+escapeHTML(e.title)+'</a></h3><p>'+escapeHTML(e.summary)+'</p><a class="post-more" href="/seminars/events/">View event details &rarr;</a></div></article>';
 }).join('');
 return (posts.length?renderPostCards(posts,config):'')+cards || '<p class="blog-empty">Stories and events from the academy will appear here soon.</p>';
}
