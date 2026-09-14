import eventSnapshot from 'virtual:sanity-events';
import {sanityConfig} from './config.js';
import {fetchContent, eventsQuery} from './shared.js';

export function normalizeEvents(items) {
  if (items === null) return null;
  if (!Array.isArray(items)) throw new Error('Invalid Sanity events response');
  return items.filter(item => typeof item.title === 'string' && typeof item.summary === 'string' && typeof item.location === 'string' && Number.isFinite(Date.parse(item.startsAt))).map(item => ({
    ...item,
    category: item.category || 'Event',
    image: /^https:\/\/cdn\.sanity\.io\/images\//.test(item.image || '') ? item.image : new URL('../assets/big class.jpg', import.meta.url).href,
    imageAlt: item.imageAlt || item.title,
    isMock: false,
    published: true,
  }));
}

export function getInitialEvents() { return normalizeEvents(eventSnapshot); }
export async function getPublishedEvents() { return normalizeEvents(await fetchContent(sanityConfig, eventsQuery)); }
