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
