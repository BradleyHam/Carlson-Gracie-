import {renderPostCards,escapeHTML,dateLabel} from './posts.js';
import {imageURL} from './shared.js';

export function isPastEvent(event,now=Date.now()) {
 const end=Date.parse(event?.endsAt || event?.startsAt);
 return Number.isFinite(end) && end <= now;
}

export function renderBlogFeed(posts,events,config,now=Date.now(),past=false){
 const covered=new Set(posts.map(p=>imageURL(p.cover,config)?.split('?')[0]).filter(Boolean));
 const linked=new Set(posts.map(p=>p.event?.id).filter(Boolean));
 const articles=posts.filter(p=>p.event ? isPastEvent(p.event,now)===past : !past);
 const selected=events.filter(e=>e.title && Number.isFinite(Date.parse(e.startsAt)) && !linked.has(e.id) && !(e.image && covered.has(e.image.split('?')[0])) && isPastEvent(e,now)===past);
 if(past){articles.sort((a,b)=>Date.parse(b.event.startsAt)-Date.parse(a.event.startsAt));selected.sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt));}
 else selected.sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
 const cards=selected.map(e=>{
  const category=e.category==='Seminar'?'Seminars':'Events';
  const image=/^https:\/\/cdn\.sanity\.io\/images\//.test(e.image||'')?'<figure><img src="'+escapeHTML(e.image)+'" alt="'+escapeHTML(e.imageAlt||e.title)+'" loading="lazy"></figure>':'';
  return '<article class="journal-card journal-event" data-category="'+category+'">'+image+'<div class="journal-card-body"><div class="journal-meta"><span class="post-tag">'+category+'</span><span>'+escapeHTML(dateLabel(e.startsAt))+'</span></div><h3><a href="/seminars/events/">'+escapeHTML(e.title)+'</a></h3><p>'+escapeHTML(e.summary)+'</p><span class="post-more" aria-hidden="true">View event details &rarr;</span></div></article>';
 }).join('');
 return (articles.length?renderPostCards(articles,config):'')+cards || (past?'':'<p class="blog-empty">Stories and upcoming events from the academy will appear here soon.</p>');
}
