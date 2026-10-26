import {academyIds} from './timetables.js';

export const courseDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const courseDefaults = {title:'Fundamentals Course',academy:'queenstown',weeks:6,startTime:'19:30',endTime:'20:30',enabled:true};
export const coursesQuery = '*[_type == "fundamentalsCourse" && enabled == true] | order(startDate asc){_id,_rev,title,academy,startDate,weeks,days,startTime,endTime,enabled}';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function parseDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return null;
  const date = new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? date : null;
}
function addDays(value, days) {
  const date = parseDate(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}
export function nzDateTime(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-NZ',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function validateCourse(course) {
  if (!academyIds.includes(course?.academy)) return 'Choose an academy.';
  const start = parseDate(course.startDate);
  if (!start) return 'Choose the date of the first class.';
  if (!Number.isInteger(course.weeks) || course.weeks < 1 || course.weeks > 52) return 'Choose a duration between 1 and 52 weeks.';
  if (!Array.isArray(course.days) || !course.days.length || course.days.some(day=>!courseDays.includes(day)) || new Set(course.days).size !== course.days.length) return 'Choose the class days.';
  if (!course.days.includes(courseDays[(start.getUTCDay()+6)%7])) return 'The starting date must fall on one of the selected class days.';
  if (!timePattern.test(course.startTime || '') || !timePattern.test(course.endTime || '')) return 'Enter start and finish times as HH:mm, for example 19:30.';
  if (course.endTime <= course.startTime) return 'The finish time must be later than the start time.';
  return true;
}
export function courseEndDate(course) {
  if (validateCourse(course) !== true) return null;
  // A block covers consecutive calendar weeks beginning on its first class.
  // Its last selected class day is the public finish date.
  for (let offset = course.weeks*7-1; offset >= 0; offset--) {
    const date = addDays(course.startDate,offset);
    if (course.days.includes(courseDays[(parseDate(date).getUTCDay()+6)%7])) return date;
  }
  return null;
}
export function courseDateRange(course) {
  const end = courseEndDate(course);
  if (!end) return '';
  const format = value => new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(parseDate(value));
  return format(course.startDate)+' – '+format(end);
}
export function courseTime(course) {
  const format = value => {const [hours,minutes]=value.split(':').map(Number); return {clock:(hours%12||12)+':'+String(minutes).padStart(2,'0'),period:hours<12?'am':'pm'};};
  const start = format(course.startTime), end = format(course.endTime);
  return start.clock+(start.period === end.period ? '' : ' '+start.period)+'–'+end.clock+' '+end.period;
}
export function visibleCourses(courses, academy, now = new Date()) {
  const localNow = nzDateTime(now);
  return (Array.isArray(courses)?courses:[]).filter(course=>
    course?.enabled === true && !String(course._id || '').startsWith('drafts.') && course.academy === academy && validateCourse(course) === true && `${courseEndDate(course)}T${course.endTime}` > localNow
  ).sort((a,b)=>a.startDate.localeCompare(b.startDate) || String(a._id).localeCompare(String(b._id)));
}
export function renderCourses(courses, academy, now = new Date()) {
  const today = nzDateTime(now).slice(0,10);
  return visibleCourses(courses,academy,now).map(course=>{
    const title = String(course.title || 'Fundamentals Course').trim();
    const range = courseDateRange(course);
    const columns = courseDays.filter(day=>course.days.includes(day)).map(day=>
      '<div class="tt-col" data-day="'+(courseDays.indexOf(day)+1)+'"><h3>'+day.slice(0,3)+' <span class="today-tag">Today</span></h3><div class="tt-class c-all" data-class-type="fundamentals"><span class="t">'+escape(courseTime(course))+'</span><span class="n">'+escape(title)+'*</span><span class="l">'+escape(range)+'</span></div></div>'
    ).join('');
    return '<section class="tt-audience tt-course" data-timetable-audience="adults" data-course-id="'+escape(course._id)+'" data-course-starts="'+course.startDate+'" data-course-ends="'+courseEndDate(course)+'T'+course.endTime+'" aria-label="'+escape(title)+'"><p class="tt-audience-title">'+(course.startDate>today?'Upcoming course':'Current course')+'</p><div class="tt-grid reveal in" role="group" aria-label="'+escape(title)+' weekly classes">'+columns+'</div><p class="tt-note">* Runs in blocks of '+course.weeks+' weeks. '+escape(range)+'.</p></section>';
  }).join('');
}
