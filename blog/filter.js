import {fetchContent,eventsQuery} from '../cms/shared.js';
import {postsQuery} from '../cms/posts.js';
import {sanityConfig} from '../cms/config.js';
import {renderBlogFeed} from '../cms/blog-feed.js';
function applyFilter(){
 const category=new URLSearchParams(location.search).get('category');
 const selected=['News','Events','Seminars','Technique'].includes(category)?category:'All';
 for(const link of document.querySelectorAll('[data-blog-filter]')){
  if(link.dataset.blogFilter===selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 }
 const cards=[...document.querySelectorAll('#blog-posts [data-category], #blog-past-posts [data-category]')];
 for(const card of cards)card.hidden=selected!=='All'&&card.dataset.category!==selected;
 for(const id of ['blog-posts','blog-past-posts']){const feed=document.getElementById(id);feed?.classList.toggle('single-result',[...feed.querySelectorAll('[data-category]')].filter(card=>!card.hidden).length===1);}
 const past=document.querySelector('#blog-past');if(past)past.hidden=![...document.querySelectorAll('#blog-past-posts [data-category]')].some(card=>!card.hidden);
 const empty=document.querySelector('#blog-filter-empty');
 if(empty)empty.hidden=selected==='All'||cards.some(card=>!card.hidden);
 const generic=document.querySelector('#blog-posts .blog-empty');if(generic)generic.hidden=selected!=='All';
}
// Filter in place while keeping category links shareable and Back/Forward usable.
document.querySelector('.blog-filter')?.addEventListener('click',event=>{
 const link=event.target.closest('a[data-blog-filter]');
 if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 if(link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||url.pathname!==location.pathname)return;
 event.preventDefault();
 if(url.href!==location.href)history.pushState(null,'',url.href);
 applyFilter();
});
window.addEventListener('popstate',applyFilter);
applyFilter();
// Refresh published content without requiring another site deployment.
const feed=document.querySelector('#blog-posts');
const archive=document.querySelector('#blog-past-posts');
let snapshot=null;
function renderSnapshot(){
 if(!snapshot||!feed||!archive)return;
 const [posts,events]=snapshot;
 feed.innerHTML=renderBlogFeed(posts,events,sanityConfig);
 archive.innerHTML=renderBlogFeed(posts,events,sanityConfig,Date.now(),true);applyFilter();
}
try{const initial=JSON.parse(document.querySelector('#blog-snapshot')?.textContent||'null');if(Array.isArray(initial)&&initial.length===2&&initial.every(Array.isArray))snapshot=initial;}catch{/* Published refresh below can recover a missing snapshot. */}
renderSnapshot();
if(feed&&archive)setInterval(renderSnapshot,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderSnapshot();});
if(feed&&archive)Promise.all([fetchContent(sanityConfig,postsQuery,{}, {cdn:false}),fetchContent(sanityConfig,eventsQuery,{}, {cdn:false})]).then(([posts,events])=>{
 if(!Array.isArray(posts)||!Array.isArray(events))return;
 snapshot=[posts,events];renderSnapshot();
}).catch(()=>{/* Keep the built content available if Sanity is temporarily unreachable. */});
