// Floating row previews share a viewport-safe position across the site.
const hover = matchMedia('(hover:hover) and (min-width:641px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const nav = document.querySelector('nav');
const badge = nav?.querySelector('.wordmark');
const edge = 20;
const gap = 24;
const switchBuffer = 36;
let pointer = null;
let activeRow = null;
let activeImage = null;
let center = null;
let side = 'above';
let frame = 0;
let lastTime = 0;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function clear() {
  activeRow?.classList.remove('is-hot');
  activeRow = activeImage = center = null;
}
function leave() {
  pointer = null;
  clear();
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
}
function schedule() {
  if (!frame && hover.matches && !document.hidden) frame = requestAnimationFrame(paint);
}
function track(event) {
  if (!hover.matches) return;
  pointer = { x: event.clientX, y: event.clientY };
  schedule();
}
function paint(time) {
  frame = 0;
  if (!hover.matches || document.hidden) { clear(); return; }
  // A scroll can change the row beneath a completely stationary cursor.
  if (!pointer) {
    const hovered = document.querySelector('.prog a:hover');
    if (!hovered) return;
    const rect = hovered.getBoundingClientRect();
    pointer = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  const row = document.elementFromPoint(pointer.x, pointer.y)?.closest('.prog a');
  const image = row?.querySelector('.prog-img');
  if (!row || !image) { clear(); lastTime = 0; return; }
  const changed = row !== activeRow;
  if (changed) {
    clear();
    activeRow = row;
    activeImage = image;
    side = 'above';
  }
  const rect = row.getBoundingClientRect();
  const width = image.offsetWidth;
  const height = image.offsetHeight;
  if (!width || !height) { schedule(); return; }
  // Stay below both the fixed bar and its slightly overhanging crest.
  const top = Math.min(innerHeight - edge, Math.max(edge,
    (nav?.getBoundingClientRect().bottom || 0) + 12,
    (badge?.getBoundingClientRect().bottom || 0) + 12));
  const bottom = innerHeight - edge;
  const tilt = reduced.matches ? 0 : clamp(((pointer.x - rect.left) / rect.width - .5) * 8, -4, 4);
  const radians = Math.abs(tilt) * Math.PI / 180;
  const rotatedWidth = width * Math.cos(radians) + height * Math.sin(radians);
  const rotatedHeight = height * Math.cos(radians) + width * Math.sin(radians);
  const scale = Math.min(1, Math.max(1, innerWidth - edge * 2) / rotatedWidth,
    Math.max(1, bottom - top) / rotatedHeight);
  const halfWidth = rotatedWidth * scale / 2;
  const halfHeight = rotatedHeight * scale / 2;
  const above = pointer.y - gap - top;
  const below = bottom - pointer.y - gap;
  const needed = halfHeight * 2;
  if (side === 'above' && above < needed) side = 'below';
  else if (side === 'below' && (above >= needed + switchBuffer || (below < needed && above >= needed))) side = 'above';
  // In a short viewport use the side with more room, then keep the full image inside it.
  if (above < needed && below < needed) side = above >= below ? 'above' : 'below';
  const target = {
    x: clamp(pointer.x, edge + halfWidth, innerWidth - edge - halfWidth),
    y: clamp(pointer.y + (side === 'above' ? -1 : 1) * (gap + halfHeight), top + halfHeight, bottom - halfHeight)
  };
  const dt = lastTime ? Math.min(64, time - lastTime) : 16;
  const ease = reduced.matches ? 1 : 1 - Math.exp(-dt / 85);
  lastTime = time;
  if (!center) center = { ...target };
  else {
    center.x += (target.x - center.x) * ease;
    center.y += (target.y - center.y) * ease;
  }
  // Clamp the eased position too, including the rotated corners during a resize.
  center.x = clamp(center.x, edge + halfWidth, innerWidth - edge - halfWidth);
  center.y = clamp(center.y, top + halfHeight, bottom - halfHeight);
  image.style.transform = `translate(${center.x - rect.left - width / 2}px, ${center.y - rect.top - height / 2}px) rotate(${tilt}deg) scale(${scale})`;
  row.classList.add('is-hot');
  schedule();
}
document.addEventListener('mousemove', track, { passive: true });
document.addEventListener('mouseover', track, { passive: true });
document.addEventListener('wheel', track, { passive: true });
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
window.addEventListener('blur', leave);
document.documentElement.addEventListener('mouseleave', leave);
document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
hover.addEventListener('change', () => { leave(); schedule(); });
reduced.addEventListener('change', schedule);
schedule();
