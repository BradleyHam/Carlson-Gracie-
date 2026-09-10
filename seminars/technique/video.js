const video = document.querySelector('.technique-feature video');

if (video) {
  let inView = false;
  let resumeAfterHidden = false;
  video.muted = true;

  function playInView() {
    if (!inView || document.hidden) return;
    const playback = video.play();
    if (playback) playback.then(() => {
      if (!inView || document.hidden) video.pause();
    }).catch(() => {
      // Native controls remain available if the browser blocks autoplay.
    });
  }

  const observer = new IntersectionObserver(([entry]) => {
    const visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
    if (visible === inView) return;
    inView = visible;
    if (inView) playInView();
    else video.pause();
  }, { threshold: [0, 0.2] });
  observer.observe(video);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeAfterHidden = !video.paused;
      video.pause();
    } else if (resumeAfterHidden) {
      resumeAfterHidden = false;
      playInView();
    }
  });
}
