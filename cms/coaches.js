import {imageURL} from './shared.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderCoaches(coaches, config) {
  if (!Array.isArray(coaches)) return null;
  return coaches.map(coach => {
    const image = imageURL(coach.photo, config);
    const colors = {white:'#eee',blue:'#305ba0',purple:'#75478d',brown:'#704d34',black:'#171717'};
    const color = colors[coach.belt];
    const stripes = Math.max(0, Math.min(10, Number.isInteger(coach.stripes) ? coach.stripes : 0));
    const belt = color ? '<div class="coach-belt" style="background:'+color+'" role="img" aria-label="'+escape(coach.belt+' belt'+(stripes ? ', '+stripes+' stripes' : ''))+'"><span class="tip">'+'<i></i>'.repeat(stripes)+'</span></div>' : '<div class="coach-belt coach-belt-tbc" aria-hidden="true"></div>';
    return '<article class="coach"><div class="coach-photo">'+(image ? '<img src="'+escape(image)+'" alt="'+escape(coach.alt || coach.name)+'" loading="lazy">' : '')+'</div>'+belt+'<h3>'+escape(coach.name)+'</h3>'+(coach.role ? '<p class="coach-rank">'+escape(coach.role)+'</p>' : '')+(coach.bio ? '<p class="coach-bio">'+escape(coach.bio).replace(/\n/g,'<br>')+'</p>' : '')+'</article>';
  }).join('');
}
