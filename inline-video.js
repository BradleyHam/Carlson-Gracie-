// Inline films share playback controls and a fallback for declined autoplay.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
for (const frame of document.querySelectorAll('.section-clip, .locations-lineage-film')) {
  const videos = [...frame.querySelectorAll('video')];
  if (!videos.length) continue;
  let visible = false;
  let userStarted = false;
  let userPaused = false;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'clip-play';
  button.textContent = 'Play video';
  frame.append(button);
  function update() {
    const playing = videos.some(v => !v.paused && !v.error);
    button.textContent = playing ? 'Pause video' : 'Play video';
    button.classList.toggle('is-playing', playing);
  }
  function play() {
    videos.forEach(v => { v.play().catch(update); });
  }
  function pause() { videos.forEach(v => v.pause()); }
  function mayPlay() { return !userPaused && (!motion.matches || userStarted); }
  button.addEventListener('click', () => {
    if (videos.some(v => !v.paused)) {
      userPaused = true;
      userStarted = false;
      pause();
    } else {
      userPaused = false;
      userStarted = true;
      videos.forEach(v => { if (v.error) v.load(); });
      play();
    }
  });
  videos.forEach(v => {
    v.muted = v.defaultMuted = v.playsInline = true;
    v.addEventListener('playing', update);
    v.addEventListener('pause', update);
    v.addEventListener('error', update);
    if (motion.matches) { v.removeAttribute('autoplay'); v.pause(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && mayPlay()) play();
      else if (!visible) pause();
    }, {threshold: .2}).observe(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (visible && mayPlay()) play();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) { userStarted = false; pause(); }
    else if (visible && mayPlay()) play();
  });
}
