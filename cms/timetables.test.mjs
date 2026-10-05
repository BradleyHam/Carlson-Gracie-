import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {load} from 'cheerio';
import {renderWeeklyTimetable, validLiveScheduleUrl, publishedSessions, liveScheduleUrl, classType} from './timetables.js';
import {timetablePlugin} from './timetable-plugin.js';

const queenstown={_id:'timetable-queenstown',_rev:'published-1',published:true,sessions:[
  {day:'Monday',time:'6:00 pm',name:'Beginners <script>alert(1)</script>',details:'All belts & new starters'},
  {day:'Sunday',time:'9:00 am',name:'Open mat'},
]};

test('only confirmed published sessions render as safe, readable weekly HTML',()=>{
  assert.equal(renderWeeklyTimetable({...queenstown,published:false}),null);
  assert.equal(publishedSessions({...queenstown,sessions:[{day:'Yesterday',time:'6 pm',name:'Bad'}]}).length,0);
  const $=load(renderWeeklyTimetable(queenstown));
  assert.equal($('.tt-col').length,2);
  assert.equal($('.tt-col[data-day="1"] .n').text(),'Beginners <script>alert(1)</script>');
  assert.equal($('.tt-col[data-day="7"] .n').text(),'Open mat');
  assert.equal($('script').length,0);
});

test('live links accept public Gymdesk schedules and reject signups and other hosts',()=>{
  assert.ok(validLiveScheduleUrl(liveScheduleUrl(null,'queenstown')));
  assert.ok(validLiveScheduleUrl(liveScheduleUrl(null,'wanaka')));
  assert.equal(liveScheduleUrl(null,'cromwell'),null);
  assert.equal(validLiveScheduleUrl('https://example.com/schedule'),null);
  assert.equal(validLiveScheduleUrl('javascript:alert(1)'),null);
  assert.equal(validLiveScheduleUrl('https://wanaka-martial-arts.gymdesk.com/signup/v/abc'),null);
});

test('published timetable replaces built academy HTML while other academies retain their posted schedules',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>({ok:true,json:async()=>({result:[queenstown]})});
  try {
    const plugin=timetablePlugin();plugin.configResolved({root:process.cwd()});await plugin.buildStart();
    const source=fs.readFileSync('locations/queenstown/index.html','utf8');
    const output=plugin.transformIndexHtml.handler(source,{filename:path.resolve('locations/queenstown/index.html')});
    const $=load(output);
    assert.equal($('#timetable [data-sanity-timetable-content] .tt-col').length,2);
    assert.equal($('#timetable h2').text(),'Weekly classes');
    assert.equal($('#timetable .tt-legend').length,0);
    assert.equal($('#timetable').attr('data-timetable-revision'),'published-1');
    assert.equal($('script:contains("alert(1)")').length,0);
    const cromwell=fs.readFileSync('locations/cromwell/index.html','utf8');
    const cr=load(plugin.transformIndexHtml.handler(cromwell,{filename:path.resolve('locations/cromwell/index.html')}));
    assert.equal(cr('#timetable .tt-col').length,7);
    assert.equal(cr('#timetable .tt-class').length,24);
    const south=fs.readFileSync('locations/south-canterbury/index.html','utf8');
    const sc=load(plugin.transformIndexHtml.handler(south,{filename:path.resolve('locations/south-canterbury/index.html')}));
    assert.equal(sc('#timetable .tt-col').length,4);
    assert.equal(sc('#timetable .tt-class').length,12);
    const directory=fs.readFileSync('training/timetable/index.html','utf8');
    const all=load(plugin.transformIndexHtml.handler(directory,{filename:path.resolve('training/timetable/index.html')}));
    assert.equal(all('#academy-schedules .academy-schedule').length,5);
    assert.equal(all('#schedule-queenstown .tt-class').length,2);
    assert.equal(all('#schedule-queenstown .tt-class[data-class-type]').length,2);
    assert.equal(all('#schedule-cromwell .tt-class').length,24);
    assert.equal(all('#schedule-south-canterbury .tt-class').length,12);
  } finally {globalThis.fetch=original;}
});

test('Foundations sessions appear under the beginner timetable filter',()=>{
  assert.equal(classType('BJJ Foundations'),'fundamentals');
  assert.equal(classType('BJJ Gi All-Levels Adult'),'adults');
});
