import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {featuredClassDefaults,renderFeaturedClasses} from './classes.js';
import {renderCoaches} from './coaches.js';
import {sanityConfig} from './config.js';

test('featured classes render the six editable cards without executable markup', () => {
  const entries=featuredClassDefaults.map(item=>({...item}));
  entries[0].name='<img src=x onerror=alert(1)>';
  const $=load(renderFeaturedClasses(entries));
  assert.equal($('.prog').length,6);
  assert.equal($('.prog h3').first().contents().first().text(),entries[0].name);
  assert.equal($('img[onerror]').length,0);
  assert.equal(renderFeaturedClasses([]),null);
});

test('coach full profile text is escaped for the details dialog', () => {
  const markup=renderCoaches([{name:'Jose',bio:'Short bio',fullBio:'A <script>alert(1)</script> profile'}],sanityConfig);
  const $=load(markup);
  assert.equal($('.coach').attr('data-coach-full-bio'),'A <script>alert(1)</script> profile');
  assert.equal($('script').length,0);
});

// The browser refresh runs after Vite has renamed the files in the built HTML.
test('CMS refresh preserves resolved image URLs for every featured class', async () => {
  const {featuredClassImages} = await import('./class-images.js');
  const {access} = await import('node:fs/promises');
  const resolved = Object.fromEntries(featuredClassDefaults.map(item => [item.key, `/assets/${item.key}-buildhash.jpg`]));
  const $ = load(renderFeaturedClasses(featuredClassDefaults, resolved));
  for (const [index, item] of featuredClassDefaults.entries()) {
    assert.equal($('.prog img').eq(index).attr('src'), resolved[item.key]);
    assert.ok(featuredClassImages[item.key], `Missing browser asset for ${item.key}`);
    await access(new URL(featuredClassImages[item.key]));
  }
});
