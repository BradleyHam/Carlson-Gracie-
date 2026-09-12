import './inline-video.js';
import './styles/mobile-nav.css';

const header = document.querySelector('body > nav');
const links = header?.querySelector('.nav-links');
if (header && links) {
  const breakpoint = window.matchMedia('(max-width: 1200px)');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'mobile-menu-trigger';
  trigger.setAttribute('aria-controls', 'mobile-menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.innerHTML = '<span>Menu</span><span class="mobile-menu-icon" aria-hidden="true"></span>';
  header.append(trigger);

  const panel = document.createElement('dialog');
  panel.id = 'mobile-menu';
  panel.className = 'mobile-menu';
  panel.setAttribute('aria-label', 'Site menu');
  panel.innerHTML = `<div class="mobile-menu-header"><span class="mobile-menu-brand"></span><button type="button" class="mobile-menu-close" aria-label="Close menu" autofocus><span>Close</span><span aria-hidden="true">×</span></button></div><div class="mobile-menu-scroll" data-lenis-prevent><div class="mobile-menu-nav" role="navigation" aria-label="Main navigation"></div><div class="mobile-menu-actions"></div></div>`;
  const brand = header.querySelector('.wordmark').cloneNode(true);
  panel.querySelector('.mobile-menu-brand').replaceWith(brand);
  const navigation = panel.querySelector('.mobile-menu-nav');
  const currentPath = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  const isCurrent = (a) => (new URL(a.href).pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/') === currentPath;
  const cleanLink = (source) => {
    const a = document.createElement('a');
    a.href = source.href;
    if (source.target) a.target = source.target;
    if (source.rel) a.rel = source.rel;
    const title = source.querySelector('.dt')?.cloneNode(true);
    title?.querySelector('em')?.remove();
    a.textContent = (title?.textContent || source.textContent).trim();
    if (isCurrent(source)) a.setAttribute('aria-current', 'page');
    return a;
  };
  const groupStates = new Map();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function animateGroup(group, expand) {
    const state = groupStates.get(group);
    const start = group.getBoundingClientRect().height;
    state.animation?.cancel();
    state.expanded = expand;
    group.style.height = '';
    group.style.overflow = 'hidden';
    group.open = true;
    const end = expand ? group.getBoundingClientRect().height : group.querySelector('summary').getBoundingClientRect().height + 1;
    const finish = () => {
      group.open = expand;
      group.style.height = '';
      group.style.overflow = '';
      state.animation = null;
    };
    if (reduceMotion.matches) { finish(); return; }
    state.animation = group.animate([{height:start + 'px'}, {height:end + 'px'}], {
      duration:420, easing:'cubic-bezier(.22,1,.36,1)', fill:'both'
    });
    state.animation.onfinish = () => { state.animation.cancel(); finish(); };
  }
  for (const item of links.children) {
    if (item.classList.contains('keep')) continue;
    const top = item.querySelector(':scope > a');
    if (!top) continue;
    const sublinks = [...item.querySelectorAll('.nav-drop a')];
    if (sublinks.length) {
      const group = document.createElement('details');
      group.className = 'mobile-menu-group';
      const summary = document.createElement('summary');
      summary.textContent = top.textContent.trim();
      if (sublinks.some(isCurrent)) summary.classList.add('is-current');
      const children = document.createElement('div');
      children.className = 'mobile-menu-children';
      sublinks.forEach(a => children.append(cleanLink(a)));
      group.append(summary, children);
      groupStates.set(group, { expanded:false, animation:null });
      summary.addEventListener('click', event => {
        event.preventDefault();
        const expand = !groupStates.get(group).expanded;
        if (expand) groupStates.forEach((state, other) => {
          if (other !== group && state.expanded) animateGroup(other, false);
        });
        animateGroup(group, expand);
      });
      navigation.append(group);
    } else {
      const a = cleanLink(top);
      a.className = 'mobile-menu-direct';
      navigation.append(a);
    }
  }
  const actions = panel.querySelector('.mobile-menu-actions');
  const timetable = links.querySelector('.nav-ghost');
  const join = links.querySelector('.nav-cta');
  if (timetable) { const a = cleanLink(timetable); a.textContent = 'View timetable'; a.className = 'mobile-menu-timetable'; actions.append(a); }
  if (join) { const a = cleanLink(join); a.textContent = 'Become a member'; a.className = 'mobile-menu-join'; actions.append(a); }
  document.body.append(panel);

  const schedule = document.createElement('dialog');
  schedule.id = 'mobile-timetable';
  schedule.className = 'mobile-timetable';
  schedule.setAttribute('aria-labelledby', 'mobile-timetable-title');
  schedule.innerHTML = `<div class="mobile-timetable-header"><div><p>Queenstown HQ</p><h2 id="mobile-timetable-title">Class timetable</h2></div><button type="button" class="mobile-menu-close" aria-label="Close timetable" autofocus><span>Close</span><span aria-hidden="true">×</span></button></div><div class="mobile-timetable-content" data-lenis-prevent aria-live="polite"></div>`;
  document.body.append(schedule);
  const scheduleContent = schedule.querySelector('.mobile-timetable-content');
  let scheduleLoaded = false;
  let scheduleLoading = false;
  let scheduleTrigger = null;
  const isTimetableLink = a => a && (a.classList.contains('mobile-menu-timetable') || a.classList.contains('nav-ghost'));
  [...panel.querySelectorAll('a'), ...links.querySelectorAll('a')].forEach(a => {
    if (isTimetableLink(a)) {
      a.setAttribute('aria-haspopup', 'dialog');
      a.setAttribute('aria-controls', schedule.id);
    }
  });
  async function openTimetable(a) {
    if (schedule.open) return;
    scheduleTrigger = a;
    lockPage();
    schedule.showModal();
    scheduleContent.scrollTop = 0;
    if (scheduleLoaded || scheduleLoading) return;
    scheduleLoading = true;
    scheduleContent.textContent = 'Loading timetable…';
    try {
      const response = await fetch('/training/timetable/');
      if (!response.ok) throw new Error('Timetable unavailable');
      const source = new DOMParser().parseFromString(await response.text(), 'text/html');
      const grid = source.querySelector('.tt-grid');
      if (!grid) throw new Error('Timetable missing');
      scheduleContent.replaceChildren();
      for (const column of grid.querySelectorAll('.tt-col')) {
        const day = document.createElement('section');
        day.className = 'mobile-timetable-day';
        const heading = document.createElement('h3');
        const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        heading.textContent = names[Number(column.dataset.day)];
        if (Number(column.dataset.day) === new Date().getDay()) {
          day.classList.add('is-today');
          const today = document.createElement('span');
          today.textContent = 'Today';
          heading.append(today);
        }
        day.append(heading);
        column.querySelectorAll('.tt-class').forEach(item => {
          const row = document.createElement('div');
          row.className = 'mobile-timetable-class';
          for (const field of ['t', 'n', 'l']) {
            const text = document.createElement('span');
            text.className = `schedule-${field}`;
            text.textContent = item.querySelector(`.${field}`)?.textContent || '';
            row.append(text);
          }
          day.append(row);
        });
        scheduleContent.append(day);
      }
      const note = document.createElement('p');
      note.className = 'mobile-timetable-note';
      note.textContent = 'Queenstown HQ times shown. Times can shift around holidays and gradings. Check before your first visit.';
      scheduleContent.append(note);
      scheduleLoaded = true;
    } catch {
      scheduleContent.innerHTML = '<p>Unable to load the timetable. Please try again or <a href="/training/timetable/">open the timetable page</a>.</p>';
    } finally {
      scheduleLoading = false;
    }
  }
  schedule.querySelector('button').addEventListener('click', () => schedule.close());
  schedule.addEventListener('click', e => { if (e.target === schedule) schedule.close(); });
  schedule.addEventListener('close', () => {
    if (!panel.open && !schedule.open) unlockPage();
    scheduleTrigger?.focus({ preventScroll:true });
  });
  header.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!isTimetableLink(a) || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openTimetable(a);
  }, true);

  let savedY = 0;
  let previousBodyStyle = null;
  let lenisWasStopped = false;
  let previousRootOverflow = '';
  let pageLocked = false;
  function lockPage() {
    if (pageLocked) return;
    pageLocked = true;
    savedY = window.scrollY;
    previousBodyStyle = document.body.getAttribute('style');
    lenisWasStopped = !!window.__lenis?.isStopped;
    window.__lenis?.stop();
    previousRootOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function openMenu() {
    if (panel.open || !breakpoint.matches) return;
    lockPage();
    panel.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('.mobile-menu-scroll').scrollTop = 0;
  }
  function closeMenu() { if (schedule.open) schedule.close(); if (panel.open) panel.close(); }
  function unlockPage() {
    if (!pageLocked) return;
    pageLocked = false;
    if (previousBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previousBodyStyle);
    document.documentElement.style.overflow = previousRootOverflow;
    window.scrollTo({ top:savedY, behavior:'instant' });
    if (!lenisWasStopped) window.__lenis?.start();
    window.__lenis?.scrollTo(savedY, { immediate:true, force:true });
  }
  panel.addEventListener('close', () => {
    if (!schedule.open && !panel.open) unlockPage();
    trigger.setAttribute('aria-expanded', 'false');
    if (breakpoint.matches) trigger.focus({ preventScroll:true });
  });
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('a[href], button:not([disabled]), summary')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  trigger.addEventListener('click', openMenu);
  panel.querySelector('.mobile-menu-close').addEventListener('click', closeMenu);
  panel.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (isTimetableLink(a)) {
      e.preventDefault();
      openTimetable(a);
    } else if (a) closeMenu();
  });
  breakpoint.addEventListener('change', e => { if (!e.matches) closeMenu(); });
  window.addEventListener('pagehide', closeMenu);
}
