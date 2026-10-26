import {sanityConfig} from './cms/config.js';
import {fetchContent} from './cms/shared.js';
import {coursesQuery, nzDateTime, renderCourses} from './cms/fundamentals.js';

const targets = [...document.querySelectorAll('[data-fundamentals-courses]')];
if (targets.length) {
  let courses = null;
  const notify = () => document.dispatchEvent(new Event('academy-courses-updated'));
  const refresh = () => {
    const now = new Date();
    const localNow = nzDateTime(now);
    for (const target of targets) {
      if (courses !== null) {
        target.innerHTML = renderCourses(courses,target.dataset.fundamentalsCourses,now);
      } else {
        // Expire built content even when the content service cannot be reached.
        for (const course of target.querySelectorAll('[data-course-ends]')) {
          if (course.dataset.courseEnds <= localNow) course.remove();
        }
      }
      const today = new Date(localNow.slice(0,10)+'T12:00:00Z').getUTCDay() || 7;
      target.querySelectorAll('.tt-col').forEach(col=>col.classList.toggle('is-today',col.closest('[data-course-starts]').dataset.courseStarts<=localNow.slice(0,10) && Number(col.dataset.day)===today));
      target.hidden = !target.querySelector('[data-course-id]');
      const schedule = target.closest('.academy-schedule, #timetable');
      for (const row of schedule.querySelectorAll('[data-course-placeholder]')) {
        row.dataset.courseSuperseded = String(!target.hidden);
        row.hidden = !target.hidden;
      }
      for (const column of schedule.querySelectorAll('[data-sanity-timetable-content] .tt-col')) {
        column.hidden = !column.querySelector('.tt-class:not([hidden])');
      }
      for (const group of schedule.querySelectorAll('[data-sanity-timetable-content] [data-timetable-audience]')) {
        group.hidden = !group.querySelector('.tt-class:not([hidden])');
      }
    }
    notify();
  };
  const load = () => fetchContent(sanityConfig,coursesQuery,{}, {cdn:false}).then(result=>{
    if (!Array.isArray(result)) throw new Error('Invalid fundamentals courses response');
    courses = result;
    refresh();
  }).catch(()=>{ /* Keep the dated build fallback; expired blocks are still removed. */ });
  refresh();
  load();
  // Open pages must also stop advertising a block after its final class.
  setInterval(refresh,60000);
  document.addEventListener('visibilitychange',()=>{if (!document.hidden) {refresh();load();}});
  document.addEventListener('academy-timetable-updated',refresh);
}
