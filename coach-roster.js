const rail = document.querySelector('#coach-roster');
if (rail) {
  const mobile = matchMedia('(max-width:640px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const cards = [...rail.children];
  const previous = document.querySelector('[data-roster-prev]');
  const next = document.querySelector('[data-roster-next]');
  function update() {
    previous.disabled = rail.scrollLeft < 2;
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
    rail.classList.toggle('at-end', next.disabled);
    if (mobile.matches) rail.tabIndex = 0;
    else rail.removeAttribute('tabindex');
  }
  function move(direction) {
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    rail.scrollTo({left: Math.round(rail.scrollLeft / step) * step + direction * step, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  rail.addEventListener('keydown', e => {
    if (!mobile.matches || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Home' || e.key === 'End') rail.scrollTo({left:e.key === 'Home' ? 0 : rail.scrollWidth,behavior:'instant'});
    else move(e.key === 'ArrowRight' ? 1 : -1);
  });
  rail.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  mobile.addEventListener('change', update);
  update();
}
