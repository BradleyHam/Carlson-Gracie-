// Select an upcoming event's ID, or use null to hide the featured section.
export const featuredEventId = 'example-team-day';

// Replace the example with confirmed event details before publication.
// Real events use ISO dates with the NZ offset, e.g. 2026-10-10T10:00:00+13:00.
// Finished events move into Past Events; unpublished events are omitted.
export const events = [{
  id: 'example-team-day',
  title: 'Team training day',
  category: 'Team gathering',
  summary: 'A day to bring the academies together. Shared technique, plenty of rounds, and time to catch up off the mats.',
  location: 'Queenstown',
  audience: 'All members',
  startsAt: null,
  endsAt: null,
  image: new URL('../../assets/big class.jpg', import.meta.url).href,
  imageAlt: 'Carlson Gracie members gathered on the mats',
  url: null,
  isMock: true,
  published: true,
}, {
  id: 'example-open-mat',
  title: 'Sunday open mat',
  category: 'Open mat',
  summary: 'An easy-going session for extra rounds, trying something new and training with teammates from across the academies.',
  location: 'Queenstown',
  audience: 'All members',
  startsAt: null,
  endsAt: null,
  image: new URL('../../assets/news hero.jpg', import.meta.url).href,
  imageAlt: 'Members lined up on the mats',
  url: null,
  isMock: true,
  published: true,
}];
