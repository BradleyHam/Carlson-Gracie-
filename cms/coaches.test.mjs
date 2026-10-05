import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {load} from 'cheerio';
import {renderCoaches} from './coaches.js';import {migrateCoachPage} from './migrate-coaches.mjs';import {sanityConfig} from './config.js';
const docs=JSON.parse(fs.readFileSync('cms/fixtures/legacy-lists.json','utf8'));
test('coach migration preserves each page’s current copy, photos and order and is repeatable',()=>{for(const doc of docs.filter(d=>['page-home','page-about-coaches'].includes(d._id))){const next=migrateCoachPage(doc);const s=next.sections.find(s=>s.coaches);assert.equal(s.coaches.length,8);assert.equal(s.coaches[0].name,'Jose Gomes');assert.ok(s.coaches.every(c=>c.photo.asset._ref));assert.deepEqual(migrateCoachPage(next),next);const old=doc.sections.find(x=>x._key===s._key);if(!old.coaches){for(const c of s.coaches){assert.ok(old.texts.some(t=>t.value===c.name));assert.ok(old.images.some(i=>i.image.asset._ref===c.photo.asset._ref));}assert.ok(s.texts.length<old.texts.length);}}});
test('coach rendering supports adding, removing, reordering, empty lists and safe text',()=>{const d=migrateCoachPage(docs.find(d=>d._id==='page-home'));const c=d.sections.find(s=>s.coaches).coaches;const added={...c[0],name:'<script>alert(1)</script>',bio:'First\nSecond'};const list=[added,c[2],c[0]];const $=load(renderCoaches(list,sanityConfig));assert.equal($('.coach').length,3);assert.equal($('h3').first().text(),added.name);assert.equal($('script').length,0);assert.equal($('.coach-bio').first().find('br').length,1);assert.equal($('h3').eq(1).text(),c[2].name);assert.equal(renderCoaches([],sanityConfig),'');assert.equal(renderCoaches(undefined,sanityConfig),null);assert.ok(!renderCoaches([{...added,photo:{asset:{_ref:'javascript:alert(1)'}}}],sanityConfig).includes('<img'));});
test('sourced biographies populate coach details while Sanity can override them',()=>{
  const sourced=renderCoaches([{name:'Renan Secco',bio:'Short bio'}],sanityConfig);
  assert.match(sourced,/data-coach-full-bio="[^"]*2019 NAGA/);
  const edited=renderCoaches([{name:'Renan Secco',fullBio:'New verified details'}],sanityConfig);
  assert.match(edited,/data-coach-full-bio="New verified details"/);
  assert.ok(!edited.includes('2019 NAGA'));
  assert.ok(!renderCoaches([{name:'Unverified Coach',bio:'Short bio'}],sanityConfig).includes('data-coach-full-bio'));
});
test('unconfirmed coach placeholders are omitted and confirmed names work without portraits',()=>{
 const $=load(renderCoaches([{name:'Head coach',role:'To confirm',placeholder:'Name and portrait to add'},{name:'Nick Scott',role:'Head trainer'}],sanityConfig));
 assert.equal($('.coach').length,1);assert.equal($('h3').text(),'Nick Scott');assert.equal($('.coach-photo').length,0);assert.equal($('.coach--text').length,1);assert(!$.text().includes('to add'));
});
test('optional achievements preserve order, omit blank items and escape markup',()=>{
 const points=['  First title  ','', '  ', '<img src=x onerror=alert(1)>', 'Second title'];
 const $=load(renderCoaches([{name:'Example',achievements:points}],sanityConfig));
 assert.deepEqual(JSON.parse($('.coach').attr('data-coach-achievements')),['First title','<img src=x onerror=alert(1)>','Second title']);
 assert.equal($('img').length,0);
 for(const achievements of [undefined,[],[' ',''],null])assert(!renderCoaches([{name:'Example',achievements}],sanityConfig).includes('data-coach-achievements'));
});

test('partially completed profiles omit pending fields and invalid portraits',()=>{
 const $=load(renderCoaches([null,{name:'TBC'},{name:'Adult coach'},{name:'Confirmed Coach',role:'To confirm',bio:' ',fullBio:{},photo:{asset:{_ref:'missing'}}}],sanityConfig));
 assert.equal($('.coach').length,1);
 assert.equal($('.coach--text').length,1);
 assert.equal($('.coach-photo, .coach-rank, .coach-bio, .coach-belt').length,0);
 assert.equal($('h3').text(),'Confirmed Coach');
});
