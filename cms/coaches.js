import {coachVerifiedBios} from './coach-verified-bios.js';
import {imageURL} from './shared.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = value => typeof value === 'string' ? value.trim() : '';
const pending = value => /^(to confirm|tbc|tbd|name and rank to confirm)$/i.test(value);
export function renderCoaches(coaches, config) {
  if (!Array.isArray(coaches)) return null;
  return coaches.filter(coach => coach && text(coach.name) && coach.active !== false && !/^(Coach\s*\d+|Head coach|Adults? coach|Kids coach|To confirm|TBC|TBD)$/i.test(text(coach.name))).map(coach => {
    const image = imageURL(coach.photo, config);
    const achievements = Array.isArray(coach.achievements) ? coach.achievements.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
    const fullBio = text(coach.fullBio) || coachVerifiedBios[text(coach.name)];
    const role = pending(text(coach.role)) ? '' : text(coach.role);
    const bio = pending(text(coach.bio)) ? '' : text(coach.bio);
    const colors = {white:'#eee',blue:'#305ba0',purple:'#75478d',brown:'#704d34',black:'#171717'};
    const color = colors[coach.belt];
    const stripes = Math.max(0, Math.min(10, Number.isInteger(coach.stripes) ? coach.stripes : 0));
    const belt = color ? '<div class="coach-belt" style="background:'+color+'" role="img" aria-label="'+escape(coach.belt+' belt'+(stripes ? ', '+stripes+' stripes' : ''))+'"><span class="tip">'+'<i></i>'.repeat(stripes)+'</span></div>' : '';
    return '<article class="coach'+(!image?' coach--text':'')+'"'+(achievements.length ? ' data-coach-achievements="'+escape(JSON.stringify(achievements))+'"' : '')+(fullBio ? ' data-coach-full-bio="'+escape(fullBio)+'"' : '')+'>'+(image ? '<div class="coach-photo"><img src="'+escape(image)+'" alt="'+escape(text(coach.alt) || text(coach.name))+'" loading="lazy"></div>' : '')+belt+'<h3>'+escape(text(coach.name))+'</h3>'+(role ? '<p class="coach-rank">'+escape(role)+'</p>' : '')+(bio ? '<p class="coach-bio">'+escape(bio).replace(/\n/g,'<br>')+'</p>' : '')+'</article>';
  }).join('');
}
