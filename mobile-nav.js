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

  let savedY = 0;
  let previousBodyStyle = null;
  let lenisWasStopped = false;
  let previousRootOverflow = '';
  function openMenu() {
    if (panel.open || !breakpoint.matches) return;
    savedY = window.scrollY;
    previousBodyStyle = document.body.getAttribute('style');
    lenisWasStopped = !!window.__lenis?.isStopped;
    window.__lenis?.stop();
    previousRootOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    panel.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('.mobile-menu-scroll').scrollTop = 0;
  }
  function closeMenu() { if (panel.open) panel.close(); }
  panel.addEventListener('close', () => {
    if (previousBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previousBodyStyle);
    document.documentElement.style.overflow = previousRootOverflow;
    window.scrollTo({ top:savedY, behavior:'instant' });
    if (!lenisWasStopped) window.__lenis?.start();
    window.__lenis?.scrollTo(savedY, { immediate:true, force:true });
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
  panel.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  breakpoint.addEventListener('change', e => { if (!e.matches) closeMenu(); });
  window.addEventListener('pagehide', closeMenu);
}
