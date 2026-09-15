import {imageURL} from './shared.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderSeminars(items, config, layout='home') {
 if (!Array.isArray(items)) return null;
 return items.map((item,index)=>{
  const src=imageURL(item.photo,config);const image=src?'<img src="'+esc(src)+'" alt="'+esc(item.alt||item.name)+'" loading="lazy">':'';
  if(layout==='cards')return '<article class="guest-card'+(index===0?' guest-card--feature':'')+'"><div class="guest-card-media">'+image+'</div><div class="guest-card-body"><div class="guest-card-meta"><span>'+esc(item.description)+'</span><em>'+String(index+1).padStart(2,'0')+'</em></div><h3>'+esc(item.name)+'</h3></div></article>';
  return '<article class="guest"><div class="guest-photo">'+image+'</div><h3>'+esc(item.name)+'</h3><p class="guest-cred">'+esc(item.description)+'</p></article>';
 }).join('');
}
