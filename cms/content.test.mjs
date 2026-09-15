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
  assert.equal(docs.length,31);
  assert.ok(docs.every(doc=>doc._type==='sitePage' && doc.route!=='/training/timetable/'));
  assert.ok(docs.every(doc=>doc.sections.every(section=>section.texts.every(item=>!item.selector))));
});
