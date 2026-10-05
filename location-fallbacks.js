// Also runs when an academy HTML file is opened directly, without the CMS build.
(() => {
  function tidyCoaches() {
    const section = document.querySelector('#coaches');
    const rail = section?.querySelector('.roster-grid');
    if (!rail) return;
    for (const card of rail.querySelectorAll('.coach')) {
      const name = card.querySelector('h3')?.textContent.trim();
      if (!name || /^(coach\s*\d+|head coach|adults? coach|kids coach|to confirm|tbc|tbd)$/i.test(name)) {
        card.remove();
        continue;
      }
      for (const placeholder of card.querySelectorAll('.ph, .coach-rank-tbc')) placeholder.remove();
      if (!card.querySelector('.coach-photo img')) card.classList.add('coach--text');
    }
    section.hidden = !rail.querySelector('.coach');
    watchImages(section);
  }

  function watchImages(root) {
    for (const img of root.querySelectorAll('img')) {
      if (img.dataset.fallbackWatched) continue;
      img.dataset.fallbackWatched = 'true';
      const failed = () => {
        const card = img.closest('.coach');
        if (card) {
          img.closest('.coach-photo')?.remove();
          card.classList.add('coach--text');
        } else {
          const figure = img.closest('.academy-photo, .method-quote-media, .location-photo');
          if (figure) {
            figure.hidden = true;
            figure.closest('.method-quote')?.classList.add('location-media-missing');
          }
        }
      };
      img.addEventListener('error', failed);
      if (img.complete && !img.naturalWidth) failed();
    }
  }

  tidyCoaches();
  watchImages(document.querySelector('main') || document.body);
  document.addEventListener('sanity:coaches-updated', tidyCoaches, true);
})();
