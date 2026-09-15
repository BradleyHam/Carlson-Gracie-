import {renderCoaches} from './coaches.js';
import {sanityConfig} from './config.js';
import {fetchContent, imageURL, pageQuery} from './shared.js';

export function applyPage(doc, root = document) {
  if (!doc || doc._type !== 'sitePage') return;
  if (typeof doc.seoTitle === 'string' && doc.seoTitle.trim()) root.title = doc.seoTitle;
  if (typeof doc.seoDescription === 'string') root.querySelector('meta[name="description"]')?.setAttribute('content', doc.seoDescription);
  const texts = new Map();
  const images = new Map();
  for (const section of doc.sections || []) {
    for (const item of section.texts || []) if (typeof item.value === 'string') texts.set(item._key, item.value);
    for (const item of section.images || []) images.set(item._key, item);
  }
  for (const el of root.querySelectorAll('[data-sanity-text]')) {
    const value = texts.get(el.dataset.sanityText);
    if (value === undefined || value === el.textContent.replace(/\s+/g, ' ').trim()) continue;
    // Text nodes only: pasted markup cannot become executable HTML.
    const nodes = value.split('\n').flatMap((line, index) => index ? [root.createElement('br'), root.createTextNode(line)] : [root.createTextNode(line)]);
    el.replaceChildren(...nodes);
  }
  for (const el of root.querySelectorAll('[data-sanity-image]')) {
    const item = images.get(el.dataset.sanityImage);
    if (!item) continue;
    const src = imageURL(item.image, sanityConfig);
    if (src) { el.src = src; el.removeAttribute('srcset'); el.removeAttribute('sizes'); }
    if (typeof item.alt === 'string') el.alt = item.alt;
  }
  for (const rail of root.querySelectorAll('[data-sanity-coaches]')) {
    const section = doc.sections?.find(s => s._key === rail.dataset.sanityCoaches);
    const markup = renderCoaches(section?.coaches, sanityConfig);
    if (markup === null) continue;
    rail.innerHTML = markup;
    rail.dispatchEvent(new Event('sanity:coaches-updated'));
  }
}
const id = document.documentElement.dataset.sanityPage;
if (id) fetchContent(sanityConfig, pageQuery, {id}).then(doc => applyPage(doc)).catch(error => console.warn('Showing the built-in page content; Sanity is unavailable.', error.message));
