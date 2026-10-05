import {sanityConfig} from './cms/config.js';
import {fetchContent} from './cms/shared.js';
import {renderWeeklyTimetable, liveScheduleUrl, renderLiveScheduleLink, timetableNote} from './cms/timetables.js';

const section = document.querySelector('#timetable[data-academy-timetable]');
if (section) {
  const academy = section.dataset.academyTimetable;
  const id = `timetable-${academy}`;
  fetchContent(sanityConfig, '*[_type == "academyTimetable" && _id == $id][0]{_id,_rev,published,sessions,note,liveUrl}', {id}, {cdn:false})
    .then(doc => {
      if (!doc) return;
      const link = section.querySelector('[data-live-schedule-link]');
      if (link) link.innerHTML = renderLiveScheduleLink(liveScheduleUrl(doc,academy));
      const markup = renderWeeklyTimetable(doc);
      if (!markup || section.dataset.timetableRevision === doc._rev) return;
      const old = section.querySelector('.tt-grid, .num-blocks, .timetable-fallback');
      if (old) old.outerHTML = markup;
      else section.querySelector('.wrap')?.insertAdjacentHTML('beforeend',markup);
      section.querySelector('.tt-legend')?.remove();
      const heading = section.querySelector('h2'); if (heading) heading.textContent = 'Weekly classes';
      const lead = section.querySelector('.lead'); if (lead) lead.textContent = 'The local academy maintains this weekly timetable. Check with the team before your first visit.';
      let note = section.querySelector('.tt-note');
      if (!note) { note = document.createElement('p'); note.className = 'tt-note'; section.querySelector('[data-sanity-timetable-content]')?.after(note); }
      note.textContent = timetableNote(doc);
      section.dataset.timetableRevision = doc._rev || '';
      const today = new Date().getDay() || 7;
      section.querySelectorAll('.tt-col[data-day]').forEach(col => col.classList.toggle('is-today',Number(col.dataset.day) === today));
    })
    .catch(() => { /* The built timetable remains readable when Sanity is unavailable. */ });
}
