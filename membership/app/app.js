const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const device = document.querySelector('[data-scroll-device]');
const product = document.querySelector('.app-product');
let frame = 0;
function updateDevice() {
  frame = 0;
  if (motion.matches || !device || !product) return;
  const rect = product.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
  device.style.setProperty('--device-y', `${20 - progress * 38}px`);
  device.style.setProperty('--device-x', `${4 - progress * 5}deg`);
  device.style.setProperty('--device-ry', `${-12 + progress * 15}deg`);
  device.style.setProperty('--device-r', `${-7 + progress * 8}deg`);
}
function queueDevice() {
  if (!frame && !motion.matches) frame = requestAnimationFrame(updateDevice);
}
window.addEventListener('scroll', queueDevice, { passive: true });
window.addEventListener('resize', queueDevice);
queueDevice();

const video = document.querySelector('#app-lesson');
const controls = document.querySelector('.app-video-controls');
const play = document.querySelector('[data-video-play]');
const sound = document.querySelector('[data-video-sound]');
let inView = false;
let userPaused = false;
let manualPlay = false;
function syncControls() {
  play.innerHTML = video.paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
  play.setAttribute('aria-label', video.paused ? 'Play lesson' : 'Pause lesson');
  sound.innerHTML = `${video.muted ? 'Sound off' : 'Sound on'} <span aria-hidden="true">♪</span>`;
  sound.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
}
function syncPlayback() {
  if (inView && !document.hidden && !userPaused && (!motion.matches || manualPlay)) {
    video.play().catch(syncControls);
  } else {
    video.pause();
  }
}
if (video && controls && play && sound && 'IntersectionObserver' in window) {
  video.muted = true;
  video.autoplay = false; // Visibility controls playback; the HTML retains a no-script fallback.
  video.pause();
  video.controls = false;
  controls.hidden = false;
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .2;
    syncPlayback();
  }, { threshold: [0, .2] });
  observer.observe(video);
  play.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      manualPlay = true;
      video.play().catch(syncControls);
    } else {
      userPaused = true;
      video.pause();
    }
  });
  sound.addEventListener('click', () => { video.muted = !video.muted; });
  video.addEventListener('play', syncControls);
  video.addEventListener('pause', syncControls);
  video.addEventListener('volumechange', syncControls);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => {
    if (motion.matches) manualPlay = false;
    syncPlayback();
    queueDevice();
  });
  syncControls();
}
