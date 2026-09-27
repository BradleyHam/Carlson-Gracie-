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
 const cards=[...document.querySelectorAll('#blog-posts [data-category]')];
 for(const card of cards)card.hidden=selected!=='All'&&card.dataset.category!==selected;
 document.querySelector('#blog-posts')?.classList.toggle('single-result',cards.filter(card=>!card.hidden).length===1);
 const empty=document.querySelector('#blog-filter-empty');
 if(empty)empty.hidden=selected==='All'||cards.some(card=>!card.hidden);
 const generic=document.querySelector('#blog-posts .blog-empty');if(generic)generic.hidden=selected!=='All';
}
applyFilter();
// Refresh published content without requiring another site deployment.
Promise.all([fetchContent(sanityConfig,postsQuery,{}, {cdn:false}),fetchContent(sanityConfig,eventsQuery,{}, {cdn:false})]).then(([posts,events])=>{
 if(!Array.isArray(posts)||!Array.isArray(events))return;
 document.querySelector('#blog-posts').innerHTML=renderBlogFeed(posts,events,sanityConfig);applyFilter();
}).catch(()=>{/* Keep the built content available if Sanity is temporarily unreachable. */});
