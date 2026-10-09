// Vite resolves these to deployed asset URLs. The CMS refresh must use the same
// bundled files as the built HTML, rather than restoring source-only paths.
export const featuredClassImages = {
  'fundamentals-course': new URL('../assets/prog-fundamentals.jpg', import.meta.url).href,
  beginners: new URL('../assets/private-coaching.jpg', import.meta.url).href,
  'all-levels': new URL('../assets/prog-gi.jpg', import.meta.url).href,
  advanced: new URL('../assets/competition.jpg', import.meta.url).href,
  womens: new URL('../assets/women-rolling-2.jpeg', import.meta.url).href,
  kids: new URL('../assets/prog-kids.jpg', import.meta.url).href,
};
