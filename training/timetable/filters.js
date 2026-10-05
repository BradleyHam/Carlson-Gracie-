const mobileGym = document.querySelector('#mobile-gym-filter');
const mobileClass = document.querySelector('#mobile-class-filter');
const academyButtons = [...document.querySelectorAll('[data-gym-filter]')];
const classButtons = [...document.querySelectorAll('[data-class-filter]')];
const params = new URLSearchParams(location.search);
let selectedAcademy = academyButtons.some(b => b.dataset.gymFilter === params.get('gym')) ? params.get('gym') : 'queenstown';
let selectedClass = classButtons.some(b => b.dataset.classFilter === params.get('class')) ? params.get('class') : 'all';
const count = document.querySelector('#timetable-result-count');
const empty = document.querySelector('#timetable-empty');
const schedules = [...document.querySelectorAll('#academy-schedules .academy-schedule')];
const names = {queenstown:'Queenstown',wanaka:'Wānaka',cromwell:'Cromwell',invercargill:'Invercargill','south-canterbury':'South Canterbury'};
const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const today = new Date().getDay() || 7;
for (const day of document.querySelectorAll('#academy-schedules .tt-col[data-day]')) {
  day.classList.toggle('is-today',Number(day.dataset.day) === today);
  const heading = day.querySelector('h3');
  if (heading) heading.setAttribute('aria-label',days[Number(day.dataset.day) % 7]);
}
function update() {
  mobileGym.value = selectedAcademy;
  mobileClass.value = selectedClass;
  academyButtons.forEach(button => button.setAttribute("aria-pressed",String(button.dataset.gymFilter === selectedAcademy)));
  classButtons.forEach(button => button.setAttribute("aria-pressed",String(button.dataset.classFilter === selectedClass)));
  let visible = 0;
  for (const schedule of schedules) {
    const gymMatches = selectedAcademy === 'all' || selectedAcademy === schedule.dataset.academy;
    let matches = 0;
    for (const day of schedule.querySelectorAll('.tt-col')) {
      let dayMatches = 0;
      for (const session of day.querySelectorAll('.tt-class')) {
        const show = selectedClass === 'all' || session.dataset.classType === selectedClass;
        session.hidden = !show;
        if (show) dayMatches++;
      }
      day.hidden = !dayMatches;
      matches += dayMatches;
    }
    schedule.hidden = !gymMatches || !matches;
    if (gymMatches) visible += matches;
  }
  count.textContent = `${visible} ${visible === 1 ? 'class' : 'classes'}${selectedAcademy === 'all' ? ' across all academies' : ' at ' + names[selectedAcademy]}`;
  empty.hidden = visible !== 0;
}
function choose() {
  const url = new URL(location.href);
  if (selectedAcademy === 'queenstown') url.searchParams.delete('gym'); else url.searchParams.set('gym',selectedAcademy);
  if (selectedClass === 'all') url.searchParams.delete('class'); else url.searchParams.set('class',selectedClass);
  history.replaceState(null,'',url);
  update();
}
academyButtons.forEach(button => button.addEventListener('click',() => { selectedAcademy = button.dataset.gymFilter; choose(); }));
classButtons.forEach(button => button.addEventListener('click',() => { selectedClass = button.dataset.classFilter; choose(); }));
mobileGym.addEventListener('change', () => { selectedAcademy = mobileGym.value; choose(); });
mobileClass.addEventListener('change', () => { selectedClass = mobileClass.value; choose(); });
update();
