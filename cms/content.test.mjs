import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {load} from 'cheerio';
import {sanityContentPlugin} from './vite-plugin.js';
import {sanityConfig} from './config.js';
import {fetchContent, imageURL, queryURL} from './shared.js';
import manifest from './manifest.json' with {type:'json'};

test('all page bindings target one safe element and preserve the existing design', async () => {
  const plugin=sanityContentPlugin(); plugin.configResolved({root:process.cwd()});
  for(const page of manifest) {
    assert.notEqual(page.file,'training/timetable/index.html');
    const html=fs.readFileSync(page.file,'utf8');
    const before=load(html);
    const result=plugin.transformIndexHtml.handler(html,{filename:path.resolve(page.file)});
    const after=load(result.html);
    assert.equal(after('[data-sanity-text], [data-sanity-image]').closest('#timetable,nav,footer,form,template').length,0,page.file);
    after('[data-sanity-text]').removeAttr('data-sanity-text');
    after('[data-sanity-image]').removeAttr('data-sanity-image');
    after('[data-sanity-coaches]').removeAttr('data-sanity-coaches');
    after('[data-sanity-seminars]').removeAttr('data-sanity-seminars').removeAttr('data-seminar-layout');
    after('[data-sanity-setting]').removeAttr('data-sanity-setting');
    after('[data-sanity-phone]').removeAttr('data-sanity-phone');
    after('html').removeAttr('data-sanity-page');
    assert.equal(after.html(),before.html(),page.file);
  }
  const timetable=fs.readFileSync('training/timetable/index.html','utf8');
  assert.equal(plugin.transformIndexHtml.handler(timetable,{filename:path.resolve('training/timetable/index.html')}),timetable);
});

test('published copy is escaped, images are constrained, timetable is unchanged', async () => {
  const previous=sanityConfig.projectId;
  const fetchBefore=globalThis.fetch;
  try {
    sanityConfig.projectId='testproject';
    const home=structuredClone(manifest[0]);
    home.sections[0].texts[0].value='<img src=x onerror=alert(1)>\nSecond line';
    home.seoTitle='Updated search title';
    globalThis.fetch=async()=>({ok:true,json:async()=>({result:[home]})});
    const plugin=sanityContentPlugin();plugin.configResolved({root:process.cwd()});await plugin.buildStart();
    const source=fs.readFileSync('index.html','utf8');
    const result=plugin.transformIndexHtml.handler(source,{filename:path.resolve('index.html')});
    const $=load(result.html);
    const changed=$('[data-sanity-text="'+home.sections[0].texts[0]._key+'"]');
    assert.equal(changed.find('img').length,0);
    assert.equal(changed.find('br').length,1);
    assert.match(changed.text(),/onerror=alert/);
    assert.equal($('title').text(),'Updated search title');
    assert.equal($('#timetable').html(),load(source)('#timetable').html());
    assert.equal(imageURL({asset:{_ref:'javascript:alert(1)'}},sanityConfig),null);
    assert.match(imageURL({asset:{_ref:'image-abc123-1200x800-jpg'}},sanityConfig),/^https:\/\/cdn.sanity.io\/images\/testproject\/production\//);
  } finally { sanityConfig.projectId=previous;globalThis.fetch=fetchBefore; }
});

test('Queenstown card uses its Sanity photo when one is published', async () => {
  const previous=sanityConfig.projectId;
  const fetchBefore=globalThis.fetch;
  try {
    sanityConfig.projectId='testproject';
    const page=structuredClone(manifest.find(item=>item._id==='page-locations'));
    page.queenstownCardPhoto={asset:{_ref:'image-abc123-1200x800-jpg'},alt:'People training at Queenstown'};
    globalThis.fetch=async()=>({ok:true,json:async()=>({result:[page]})});
    const plugin=sanityContentPlugin();plugin.configResolved({root:process.cwd()});await plugin.buildStart();
    const source=fs.readFileSync('locations/index.html','utf8');
    const result=plugin.transformIndexHtml.handler(source,{filename:path.resolve('locations/index.html')});
    const $=load(result.html);
    const image=$('.academy-card--hq .academy-card-media img');
    assert.match(image.attr('src'),/^https:\/\/cdn.sanity.io\/images\/testproject\/production\/abc123-1200x800.jpg/);
    assert.equal(image.attr('alt'),'People training at Queenstown');
  } finally { sanityConfig.projectId=previous;globalThis.fetch=fetchBefore; }
});

test('queries use published content, safely encode parameters, and surface failures', async () => {
  const config={projectId:'testproject',dataset:'production',apiVersion:'2025-02-19'};
  const url=queryURL(config,'*[_id == $id]',{id:'a" || true'});
  assert.equal(url.searchParams.get('perspective'),'published');
  assert.equal(JSON.parse(url.searchParams.get('$id')),'a" || true');
  assert.equal(await fetchContent({...config,projectId:''},'query'),null);
  await assert.rejects(fetchContent(config,'query',{}, {fetcher:async()=>({ok:false,status:503})}),/503/);
});

test('seed documents contain no timetable bindings or mock events', () => {
  const docs=fs.readFileSync('cms/seed.ndjson','utf8').trim().split('\n').map(JSON.parse);
  assert.equal(docs.length,32);
  assert.ok(docs.every(doc=>doc._type==='sitePage' && doc.route!=='/training/timetable/'));
  assert.ok(docs.every(doc=>doc.sections.every(section=>section.texts.every(item=>!item.selector))));
});


test('location coach sections hide for empty, archived and unresolved rosters at build time', async () => {
  const fetchBefore=globalThis.fetch;
  try {
    for (const profiles of [[], [null], [{name:'Archived coach',active:false}], [{name:'Coach 01',role:'To confirm'}], [{name:'Delwyn Moller',active:true}]]) {
      const page=structuredClone(manifest.find(p=>p._id==='page-locations-wanaka'));
      const section=page.sections.find(s=>s.coachSelector);
      section.coachRefs=profiles.map((_,i)=>({_ref:'coach-'+i}));
      section.coachProfiles=profiles;
      globalThis.fetch=async()=>({ok:true,json:async()=>({result:[page]})});
      const plugin=sanityContentPlugin();plugin.configResolved({root:process.cwd()});await plugin.buildStart();
      const source=fs.readFileSync(page.file,'utf8');
      const $=load(plugin.transformIndexHtml.handler(source,{filename:path.resolve(page.file)}).html);
      const visible=profiles.some(p=>p?.name==='Delwyn Moller');
      assert.equal($('#coaches').is('[hidden]'),!visible);
      assert.equal($('#coaches .coach').length,visible?1:0);
      assert.equal($('#timetable').html(),load(source)('#timetable').html());
    }
  } finally {globalThis.fetch=fetchBefore;}
});

test('live coach updates hide the section and restore it when a profile is added', async () => {
  const previousDocument=globalThis.document;
  try {
    globalThis.document={documentElement:{dataset:{}}};
    const {applyPage}=await import('./browser.js');
    const container={hidden:false};
    const rail={dataset:{sanityCoaches:'team'},innerHTML:'old coaches',closest:()=>container,dispatchEvent:()=>{}};
    const root={querySelector:()=>null,querySelectorAll:selector=>selector==='[data-sanity-coaches]'?[rail]:[]};
    const page={_type:'sitePage',sections:[{_key:'team',coaches:[]}]};
    applyPage(page,root);assert.equal(container.hidden,true);assert.equal(rail.innerHTML,'');
    page.sections[0].coaches=[{name:'Delwyn Moller'}];
    applyPage(page,root);assert.equal(container.hidden,false);assert.match(rail.innerHTML,/Delwyn Moller/);
    delete page.sections[0].coaches;
    applyPage(page,root);assert.equal(container.hidden,false);assert.match(rail.innerHTML,/Delwyn Moller/);
  } finally {if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});

test('academy fallback HTML omits unnamed coaches and portrait placeholders without Sanity', () => {
  for (const academy of ['queenstown','wanaka','cromwell','invercargill','south-canterbury']) {
    const $ = load(fs.readFileSync(`locations/${academy}/index.html`, 'utf8'));
    assert.equal($('#coaches .ph, #coaches .coach-rank-tbc').length, 0, academy);
    assert.equal($('#coaches .coach').length === 0, $('#coaches').is('[hidden]'), academy);
    assert.equal($('script[src="../../location-fallbacks.js"]').length, 1, academy);
    assert.ok($('#timetable .tt-class').length > 0, academy);
  }
});

test('missing academy copy and unresolved coach references retain useful content and hide the team', async () => {
  const previous = globalThis.fetch;
  try {
    const page = structuredClone(manifest.find(p => p._id === 'page-locations-invercargill'));
    page.seoTitle = ' ';
    page.seoDescription = '';
    page.sections[0].texts.forEach(t => { t.value = ' '; });
    const team = page.sections.find(s => s.coachSelector);
    team.coachRefs = [{_ref:'missing-coach'}];
    team.coachProfiles = [null];
    globalThis.fetch = async () => ({ok:true,json:async()=>({result:[page]})});
    const plugin = sanityContentPlugin();
    plugin.configResolved({root:process.cwd()});
    await plugin.buildStart();
    const html = fs.readFileSync(page.file, 'utf8');
    const $ = load(plugin.transformIndexHtml.handler(html,{filename:path.resolve(page.file)}).html);
    const source = load(html);
    assert.equal($('h1').text(), source('h1').text());
    assert.equal($('title').text(), source('title').text());
    assert.equal($('meta[name="description"]').attr('content'), source('meta[name="description"]').attr('content'));
    assert.equal($('#coaches').is('[hidden]'), true);
    assert.equal($('#coaches .coach').length, 0);
    assert.equal($('#timetable .tt-class').length, 15);
  } finally { globalThis.fetch = previous; }
});
