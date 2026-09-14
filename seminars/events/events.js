import {getPublishedEvents, getInitialEvents} from '../../cms/events.js';
import { events, featuredEventId } from './events-data.js';

export function splitEvents(items, now = Date.now()) {
  const upcoming = [], past = [];
  for (const item of items) {
    if (item.published === false) continue;
    const start = Date.parse(item.startsAt);
    const end = Date.parse(item.endsAt || item.startsAt);
    if (item.isMock) upcoming.push(item);
    else if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      (end >= now ? upcoming : past).push(item);
    }
  }
  upcoming.sort((a, b) => (Date.parse(a.startsAt) || Infinity) - (Date.parse(b.startsAt) || Infinity));
  past.sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
  return { upcoming, past };
}

const dateFormat = new Intl.DateTimeFormat('en-NZ', {timeZone:'Pacific/Auckland', day:'numeric', month:'long', year:'numeric'});
function dateLabel(event) {
  return event.isMock ? 'Date to be confirmed' : dateFormat.format(new Date(event.startsAt));
}
function fill(root, selector, text) { root.querySelector(selector).textContent = text; }
function action(root, event) {
  const el = root.querySelector('[data-action]');
  if (!event.isMock && event.url && /^(https?:\/\/|\/(?!\/))/.test(event.url)) {
    const link = document.createElement('a');
    link.className = 'event-action'; link.href = event.url;
    link.textContent = 'View event details →'; el.replaceWith(link);
  } else el.textContent = event.isMock ? 'Example only · not a scheduled event' : 'More details coming soon';
}

export function renderEvents(items = events, featuredId = featuredEventId, now = Date.now()) {
  const { upcoming, past } = splitEvents(items, now);
  const feature = document.querySelector('[data-featured-event]');
  const selected = upcoming.find(event => event.id === featuredId);
  feature.hidden = !selected;
  document.querySelector('[data-featured-link]').hidden = !selected;
  if (selected) {
    fill(feature, '[data-title]', selected.title);
    fill(feature, '[data-summary]', selected.summary);
    fill(feature, '[data-date]', dateLabel(selected));
    fill(feature, '[data-location]', selected.location);
    fill(feature, '[data-audience]', selected.audience || '');
    fill(feature, '[data-category]', selected.category);
    feature.querySelector('[data-mock]').hidden = !selected.isMock;
    const img = feature.querySelector('img'); img.src = selected.image; img.alt = selected.imageAlt;
    // Reset the action so repeat renders also clear a previous link.
    feature.querySelector('.event-feature-action').innerHTML = '<p data-action></p>';
    action(feature, selected);
  }
  const list = document.querySelector('[data-upcoming-list]'); list.replaceChildren();
  document.querySelector('[data-upcoming-empty]').hidden = upcoming.length > 0;
  for (const event of upcoming) {
    const row = document.querySelector('#event-row-template').content.cloneNode(true);
    fill(row, '[data-date]', dateLabel(event));
    fill(row, '[data-category]', event.isMock ? 'Example event' : event.category);
    fill(row, '[data-title]', event.title);
    fill(row, '[data-summary]', event.summary);
    fill(row, '[data-location]', event.location);
    const image = row.querySelector(".event-row-image img");
    image.src = event.image; image.alt = event.imageAlt;
    action(row, event); list.append(row);
  }
  document.querySelectorAll('[data-dated-past]').forEach(el => el.remove());
  const archive = document.querySelector('[data-past-list]');
  const fragment = document.createDocumentFragment();
  for (const event of past) {
    const card = document.querySelector('#past-event-template').content.cloneNode(true);
    fill(card, '[data-title]', event.title);
    fill(card, '[data-date]', dateLabel(event));
    fill(card, '[data-summary]', event.summary);
    const img = card.querySelector('img'); img.src = event.image; img.alt = event.imageAlt;
    action(card, event); fragment.append(card);
  }
  archive.prepend(fragment);
}
const initialEvents = getInitialEvents();
if (initialEvents === null) renderEvents();
else renderEvents(initialEvents, splitEvents(initialEvents).upcoming.find(item => item.featured)?.id || null);
getPublishedEvents().then(items => {
  if (items !== null) renderEvents(items, splitEvents(items).upcoming.find(item => item.featured)?.id || null);
}).catch(error => console.warn('Showing built-in events; Sanity is unavailable.', error.message));


const rail = document.querySelector('[data-past-list]');
const shell = rail.closest('.events-past-rail');
const prev = document.querySelector('[data-past-prev]');
const next = document.querySelector('[data-past-next]');
function updateRail() {
  const atStart = rail.scrollLeft <= 2;
  const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
  shell.classList.toggle('is-at-start', atStart);
  shell.classList.toggle('is-at-end', atEnd);
  prev.disabled = atStart;
  next.disabled = atEnd;
}
function stepRail(direction) {
  const card = rail.querySelector('.journal-card');
  const gap = parseFloat(getComputedStyle(rail).gap) || 0;
  rail.scrollBy({left:direction * (card.getBoundingClientRect().width + gap), behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
prev.addEventListener('click', () => stepRail(-1));
next.addEventListener('click', () => stepRail(1));
rail.addEventListener('scroll', updateRail, {passive:true});
new ResizeObserver(updateRail).observe(rail);
new MutationObserver(updateRail).observe(rail, {childList:true});
updateRail();

// Recheck the row under a stationary pointer as scrolling moves the page.
const rowHover = matchMedia('(hover:hover) and (pointer:fine)');
let rowPointer = null;
let hoveredEventRow = null;
let rowHoverFrame = 0;
function clearRowHover() {
  hoveredEventRow?.classList.remove('is-pointer-over');
  hoveredEventRow = null;
}
function updateRowHover() {
  rowHoverFrame = 0;
  if (!rowHover.matches || !rowPointer || document.hidden) { clearRowHover(); return; }
  const row = document.elementFromPoint(rowPointer.x, rowPointer.y)?.closest('.event-row');
  if (row === hoveredEventRow) return;
  clearRowHover();
  if (row) { hoveredEventRow = row; row.classList.add('is-pointer-over'); }
}
function scheduleRowHover() {
  if (!rowHoverFrame) rowHoverFrame = requestAnimationFrame(updateRowHover);
}
function trackRowPointer(event) {
  if (event.pointerType === 'touch') return;
  rowPointer = { x: event.clientX, y: event.clientY };
  scheduleRowHover();
}
function resetRowPointer() {
  rowPointer = null;
  clearRowHover();
}
document.addEventListener('pointermove', trackRowPointer, { passive: true });
document.addEventListener('pointerover', trackRowPointer, { passive: true });
document.addEventListener('wheel', trackRowPointer, { passive: true });
document.addEventListener('scroll', scheduleRowHover, { passive: true, capture: true });
window.addEventListener('resize', scheduleRowHover);
window.addEventListener('blur', resetRowPointer);
document.documentElement.addEventListener('pointerleave', resetRowPointer);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetRowPointer(); });
rowHover.addEventListener('change', resetRowPointer);
