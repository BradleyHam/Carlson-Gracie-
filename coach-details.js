import './styles/coach-details.css';

const dialog = document.createElement('dialog');
dialog.className = 'coach-details-dialog';
dialog.setAttribute('aria-labelledby', 'coach-profile-title');
dialog.innerHTML = `<div class="coach-details-panel" data-lenis-prevent><button type="button" class="coach-details-close" aria-label="Close coach profile"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button><div class="coach-details-content"></div></div>`;
document.body.append(dialog);
const content = dialog.querySelector('.coach-details-content');
const close = dialog.querySelector('.coach-details-close');
let opener;
function open(card, button) {
  opener = button;
  const image = card.querySelector('.coach-photo img')?.cloneNode(true);
  const name = card.querySelector('h3')?.textContent?.trim() || 'Coach';
  const roleText = card.querySelector('.coach-rank')?.textContent?.trim();
  const role = /^bio to confirm$/i.test(roleText || '') ? '' : roleText;
  const fullBio = card.dataset.coachFullBio?.trim();
  const shortBio = card.querySelector('.coach-bio')?.textContent?.trim();
  const bio = fullBio || (/^bio to confirm$/i.test(shortBio || '') ? '' : shortBio);
  content.replaceChildren();
  content.classList.toggle('coach-details-content--text-only', !image);
  if (image) {
    const portrait = document.createElement('figure');
    portrait.className = 'coach-details-portrait';
    image.loading = 'eager';
    portrait.append(image);
    const caption = document.createElement('figcaption');
    caption.textContent = 'Carlson Gracie / New Zealand';
    portrait.append(caption);
    content.append(portrait);
  }
  const copy = document.createElement('div');
  copy.className = 'coach-details-copy';
  const eyebrow = document.createElement('p'); eyebrow.className = 'coach-details-kicker'; eyebrow.textContent = 'The people behind the practice'; copy.append(eyebrow);
  const title = document.createElement('h2'); title.className = 'display'; title.id = 'coach-profile-title'; title.tabIndex = -1; title.textContent = name; copy.append(title);
  if (role) { const rank = document.createElement('p'); rank.className = 'coach-details-rank'; rank.textContent = role; copy.append(rank); }
  if (bio) {
    const description = document.createElement('div');
    description.className = 'coach-details-bio';
    let paragraphs = bio.split(/\n\s*\n|\n/).filter(text => text.trim());
    if (paragraphs.length === 1 && bio.length > 420 && typeof Intl.Segmenter === 'function') {
      const sentences = [...new Intl.Segmenter('en', {granularity:'sentence'}).segment(bio)].map(item => item.segment);
      paragraphs = [];
      for (let i = 0; i < sentences.length; i += 3) paragraphs.push(sentences.slice(i, i + 3).join(''));
    }
    for (const text of paragraphs) {
      const paragraph = document.createElement('p'); paragraph.textContent = text.trim(); description.append(paragraph);
    }
    copy.append(description);
  }
  let achievements = [];
  try {
    const items = JSON.parse(card.dataset.coachAchievements || '[]');
    if (Array.isArray(items)) achievements = items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim());
  } catch { /* A malformed optional field must not prevent opening a profile. */ }
  if (achievements.length) {
    const section = document.createElement('section');
    section.className = 'coach-details-achievements';
    section.setAttribute('aria-labelledby', 'coach-achievements-title');
    const heading = document.createElement('h3');
    heading.id = 'coach-achievements-title';
    heading.textContent = 'Achievements';
    const list = document.createElement('ul');
    for (const achievement of achievements) {
      const item = document.createElement('li');
      item.textContent = achievement;
      list.append(item);
    }
    section.append(heading, list);
    copy.append(section);
  }
  if (!fullBio && !achievements.length) {
    const pending = document.createElement('p');
    pending.className = 'coach-details-pending';
    pending.textContent = 'Full biography coming soon.';
    copy.append(pending);
  }
  content.append(copy);
  dialog.showModal();
  dialog.scrollTop = 0;
  title.focus({preventScroll:true});
}
function enhance(root) {
  for (const card of root.querySelectorAll('.coach')) {
    if (card.querySelector('.coach-details-button')) continue;
    const name = card.querySelector('h3')?.textContent?.trim();
    if (!name) continue;
    card.classList.add('coach-has-profile');
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'coach-details-button';
    button.textContent = 'View profile'; button.setAttribute('aria-label', `View profile for ${name}`);
    button.addEventListener('click', () => open(card, button));
    card.addEventListener('click', event => {
      if (!event.target.closest('a, button')) open(card, button);
    });
    card.append(button);
  }
}
document.querySelectorAll('.coach-grid, .roster-grid').forEach(rail => {
  enhance(rail);
  rail.addEventListener('sanity:coaches-updated', () => enhance(rail));
});
close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => opener?.focus());
