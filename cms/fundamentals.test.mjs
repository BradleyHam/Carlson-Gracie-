import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {load} from 'cheerio';
import {courseDefaults, coursesQuery, validateCourse, courseEndDate, courseTime, visibleCourses, renderCourses, nzDateTime} from './fundamentals.js';
import {timetablePlugin} from './timetable-plugin.js';

const course = {...courseDefaults,_id:'test-course',startDate:'2026-11-02',days:['Monday','Wednesday']};

test('six-week blocks end on the final selected class day, across months, years and NZ daylight saving',()=>{
  assert.equal(validateCourse(course),true);
  assert.equal(courseEndDate(course),'2026-12-09');
  assert.equal(courseEndDate({...course,days:['Monday']}),'2026-12-07');
  assert.equal(courseEndDate({...course,startDate:'2026-12-07'}),'2027-01-13');
  assert.equal(courseEndDate({...course,startDate:'2026-09-07'}),'2026-10-14');
  assert.equal(courseTime(course),'7:30–8:30 pm');
  assert.equal(courseTime({...course,startTime:'11:30',endTime:'12:30'}),'11:30 am–12:30 pm');
});

test('incomplete blocks and inconsistent first dates cannot be published or shown',()=>{
  for (const change of [{startDate:undefined},{startDate:'2026-02-30'},{startDate:'2026-11-03'},{days:[]},{days:['Monday','Monday']},{weeks:0},{weeks:1.5},{weeks:53},{startTime:'7:30 pm'},{endTime:'19:00'},{academy:'missing'}]) {
    assert.notEqual(validateCourse({...course,...change}),true);
    assert.equal(renderCourses([{...course,...change}],'queenstown'), '');
  }
});

test('upcoming blocks show immediately and expire at the final class finish in New Zealand time',()=>{
  assert.equal(visibleCourses([course],'queenstown',new Date('2026-10-26T00:00:00Z')).length,1);
  assert.equal(visibleCourses([course],'queenstown',new Date('2026-12-09T07:29:00Z')).length,1);
  assert.equal(nzDateTime(new Date('2026-12-09T07:30:00Z')),'2026-12-09T20:30');
  assert.equal(visibleCourses([course],'queenstown',new Date('2026-12-09T07:30:00Z')).length,0);
  assert.equal(visibleCourses([{...course,enabled:false}],'queenstown').length,0);
  assert.equal(visibleCourses([{...course,_id:'drafts.test-course'}],'queenstown').length,0);
  assert.equal(visibleCourses([course],'wanaka').length,0);
});

test('course timetable preserves filters and dates and escapes owner text',()=>{
  const $=load(renderCourses([{...course,title:'Basics <img src=x onerror=alert(1)>'}],'queenstown',new Date('2026-10-26T00:00:00Z')));
  assert.equal($('.tt-class[data-class-type="fundamentals"]').length,2);
  assert.equal($('.tt-col[data-day="1"] .t').text(),'7:30–8:30 pm');
  assert.match($('.tt-note').text(),/\* Runs in blocks of 6 weeks. 2 Nov 2026 – 9 Dec 2026/);
  assert.equal($('img').length,0);
  assert.equal($('[data-course-ends]').attr('data-course-ends'),'2026-12-09T20:30');
});

test('one published block reaches home, academy and timetable without changing regular weekly sessions',async()=>{
  const original=globalThis.fetch;
  const future={...course,startDate:'2099-11-02',days:['Monday','Wednesday']};
  // 2099-11-02 is a Monday; a distant date makes build-time expiry independent of the test runner clock.
  assert.equal(validateCourse(future),true);
  const timetable={_id:'timetable-queenstown',published:true,sessions:[
    {day:'Monday',name:'Gi All Levels',time:'6:00–7:30 pm'},
    ...['Monday','Wednesday'].map(day=>({day,name:'Fundamentals Course*',time:'7:30–8:30 pm',blockOnly:true})),
  ]};
  globalThis.fetch=async url=>({ok:true,json:async()=>({result:new URL(url).searchParams.get('query')===coursesQuery?[future]:[timetable]})});
  try {
    const plugin=timetablePlugin();plugin.configResolved({root:process.cwd()});await plugin.buildStart();
    for (const file of ['index.html','training/timetable/index.html','locations/queenstown/index.html']) {
      const $=load(plugin.transformIndexHtml.handler(fs.readFileSync(file,'utf8'),{filename:path.resolve(file)}));
      const target=$('[data-fundamentals-courses="queenstown"]');
      assert.equal(target.length,1,file);
      assert.equal(target.find('.tt-class').length,2,file);
      assert.equal(target.attr('hidden'),undefined,file);
      assert.equal($('[data-fundamentals-courses="wanaka"] .tt-class').length,0);
      assert.equal($('[data-sanity-timetable-content]').first().find('.tt-class:not([hidden])').length,1);
      assert.equal($('[data-course-placeholder][data-course-superseded="true"][hidden]').length,2);
    }
  } finally {globalThis.fetch=original;}
});
