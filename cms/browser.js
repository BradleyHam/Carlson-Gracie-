import {academyPhotoSources} from './academy-photos.js';
import {settingHref, originalPhonePattern} from './settings.js';
import {resolvePageProfiles} from './profiles.js';
import {renderSeminars} from './seminars.js';
import {renderCoaches} from './coaches.js';
import {renderFeaturedClasses} from './classes.js';
import {featuredClassImages} from './class-images.js';
import {sanityConfig} from './config.js';
import {fetchContent, imageURL, pageQuery} from './shared.js';

export function applyPage(doc, root = document) {
  if (!doc || doc._type !== 'sitePage') return;
  doc = resolvePageProfiles(doc);
  const locationPage = doc._id?.startsWith('page-locations') || false;
  if (typeof doc.seoTitle === 'string' && doc.seoTitle.trim()) root.title = doc.seoTitle;
  if (typeof doc.seoDescription === 'string' && (!locationPage || doc.seoDescription.trim())) root.querySelector('meta[name="description"]')?.setAttribute('content', doc.seoDescription);
  const texts = new Map();
  const images = new Map();
  for (const section of doc.sections || []) {
    for (const item of section.texts || []) if (typeof item.value === 'string') texts.set(item._key, item.value);
    for (const item of section.images || []) images.set(item._key, item);
  }
  for (const el of root.querySelectorAll('[data-sanity-text]')) {
    const value = texts.get(el.dataset.sanityText);
    if (value === undefined || (locationPage && !value.trim()) || value === el.textContent.replace(/\s+/g, ' ').trim()) continue;
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

  if (doc._id === 'page-locations') for (const slug of Object.keys(academyPhotoSources)) {
    const photo = doc.academyPhotos?.[slug];
    const src = imageURL(photo?.image, sanityConfig);
    const image = root.querySelector('[data-academy-photo="'+slug+'"]');
    if (!src || !image) continue;
    image.src = src;
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    if (typeof photo.alt === 'string' && photo.alt.trim()) image.alt = photo.alt;
  }
  const classes = root.querySelector('[data-sanity-classes]');
  const classMarkup = renderFeaturedClasses(doc.featuredClasses, featuredClassImages);
  if (classes && classMarkup !== null) classes.innerHTML = classMarkup;
  for (const rail of root.querySelectorAll('[data-sanity-coaches]')) {
    const section = doc.sections?.find(s => s._key === rail.dataset.sanityCoaches);
    const markup = renderCoaches(section?.coaches, sanityConfig);
    if (markup === null) continue;
    rail.innerHTML = markup;
    const container = rail.closest('section');
    if (container) container.hidden = !markup.trim();
    rail.dispatchEvent(new Event('sanity:coaches-updated'));
  }
  for (const rail of root.querySelectorAll('[data-sanity-seminars]')) {
    const section = doc.sections?.find(s => s._key === rail.dataset.sanitySeminars);
    const markup = renderSeminars(section?.seminars, sanityConfig, rail.dataset.seminarLayout);
    if (markup === null) continue;
    rail.innerHTML = markup;
    rail.dispatchEvent(new Event('sanity:seminars-updated'));
  }
  if(settingHref(doc.settings,'phone'))for(const el of root.querySelectorAll('[data-sanity-phone]')){
    const previous=el.dataset.sanityPhone;
    for(const node of el.childNodes)if(node.nodeType===3)node.textContent=(previous?node.textContent.split(previous).join(doc.settings.phone):node.textContent).replace(originalPhonePattern,doc.settings.phone);
    el.dataset.sanityPhone=doc.settings.phone;
  }
  for(const el of root.querySelectorAll('[data-sanity-setting]')){
    const key=el.dataset.sanitySetting;const href=settingHref(doc.settings,key);if(!href)continue;
    if(key==='phone')for(const node of el.childNodes)if(node.nodeType===3)node.textContent=node.textContent.replace(/\+64 21 0230 4516|021 0230 4516/g,doc.settings.phone);
    el.setAttribute('href',href);
  }
}
const id = document.documentElement.dataset.sanityPage;
if (id) fetchContent(sanityConfig, pageQuery, {id}).then(doc => applyPage(doc)).catch(error => console.warn('Showing the built-in page content; Sanity is unavailable.', error.message));
