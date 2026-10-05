export const academyIds = ['queenstown','wanaka','cromwell','invercargill','south-canterbury'];
export const timetableQuery = '*[_type == "academyTimetable" && _id in ["timetable-queenstown","timetable-wanaka","timetable-cromwell","timetable-invercargill","timetable-south-canterbury"]]{_id,_rev,published,sessions,note,liveUrl}';
export const defaultLiveScheduleUrls = {
  queenstown: 'https://app.gymdesk.com/widgets/schedule/render/gym/DoKNw',
  wanaka: 'https://app.gymdesk.com/widgets/schedule/render/gym/Arq1m',
};
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export function classType(name, details = '') {
  const title = String(name || '').toLowerCase();
  const extra = String(details || '').toLowerCase();
  if (/\b(kids?|teens?|ninjas?|youth)\b/.test(title + ' ' + extra)) return 'kids';
  if (/women|womens|women’s/.test(title)) return 'women';
  if (/no[ -]?gi/.test(title)) return 'nogi';
  if (/fundamental|foundation|beginner|basics/.test(title)) return 'fundamentals';
  if (/open mat|live rounds/.test(title)) return 'open';
  if (/wrestling|competition/.test(title)) return 'other';
  return 'adults';
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function validLiveScheduleUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !(host === 'app.gymdesk.com' || host.endsWith('.gymdesk.com'))) return null;
    if (!/^\/(?:widgets\/schedule\/render\/gym\/[A-Za-z0-9]+|schedule)\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
export function liveScheduleUrl(doc, academy) {
  return validLiveScheduleUrl(doc?.liveUrl) || defaultLiveScheduleUrls[academy] || null;
}
export function publishedSessions(doc) {
  if (!doc?.published || !Array.isArray(doc.sessions)) return [];
  return doc.sessions.filter(item => days.includes(item?.day) && typeof item.time === 'string' && item.time.trim() && typeof item.name === 'string' && item.name.trim());
}
export function renderWeeklyTimetable(doc) {
  const sessions = publishedSessions(doc);
  if (!sessions.length) return null;
  const columns = days.map((day,index) => {
    const entries = sessions.filter(item => item.day === day);
    if (!entries.length) return '';
    const rows = entries.map(item => '<div class="tt-class c-all" data-class-type="'+classType(item.name,item.details)+'"><span class="t">'+escape(item.time.trim())+'</span><span class="n">'+escape(item.name.trim())+'</span>'+(item.details ? '<span class="l">'+escape(item.details.trim())+'</span>' : '')+'</div>').join('');
    return '<div class="tt-col" data-day="'+(index+1)+'"><h3>'+day.slice(0,3)+' <span class="today-tag">Today</span></h3>'+rows+'</div>';
  }).join('');
  return '<div class="tt-grid reveal in" data-sanity-timetable-content role="group" aria-label="Weekly class timetable">'+columns+'</div>';
}
export function timetableNote(doc) {
  return typeof doc?.note === 'string' && doc.note.trim() ? doc.note.trim() : 'Times may change for holidays, events and gradings. Check before your first visit.';
}
export function renderLiveScheduleLink(url) {
  const valid = validLiveScheduleUrl(url);
  return valid ? '<a class="btn btn-solid" href="'+escape(valid)+'" target="_blank" rel="noopener">View live timetable ↗</a>' : '';
}
