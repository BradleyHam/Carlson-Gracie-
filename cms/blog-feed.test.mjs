import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {renderBlogFeed} from './blog-feed.js';
test('published events populate seminar filters safely without requiring a matching blog post',()=>{
 const event={title:'Guest <coach>',category:'Seminar',startsAt:'2026-10-03T20:00:00Z',summary:'Kids and adults',image:'https://cdn.sanity.io/images/a/b/poster.jpg'};
 const $=load(renderBlogFeed([], [event],{},Date.parse('2026-10-02T00:00:00Z')));assert.equal($('[data-category="Seminars"]').length,1);assert.equal($('h3').text(),'Guest <coach>');assert.equal($('coach').length,0);assert.equal($('img').length,1);assert.match($.text(),/4 October 2026/);
 assert.equal($('.journal-event a').length,1);assert.equal($('.journal-event h3 a').attr('href'),'/seminars/events/');assert.equal($('.journal-event .post-more').attr('aria-hidden'),'true');
 assert(!renderBlogFeed([],[],{}).includes('journal-event'));
});


test('event articles show the competition date and move once at midnight in New Zealand',()=>{
 const config={projectId:'i27dttcu',dataset:'production'};
 const event={id:'competition',title:'King of the South IX',startsAt:'2026-10-03T01:14:00Z',endsAt:'2026-10-03T11:00:00Z',image:'https://cdn.sanity.io/images/i27dttcu/production/abc-1080x1350.jpg'};
 const post={title:'King of the South IX',category:'Events',slug:{current:'king-of-the-south'},publishedAt:'2026-09-25T06:03:22Z',cover:{asset:{_ref:'image-abc-1080x1350-jpg'}},event};
 const news={title:'Team news',category:'News',slug:{current:'team-news'},publishedAt:'2026-01-01T00:00:00Z'};
 const seminar={id:'seminar',title:'Sunday seminar',category:'Seminar',startsAt:'2026-10-03T20:00:00Z',endsAt:'2026-10-03T23:00:00Z'};
 const before=Date.parse('2026-10-03T10:59:59.999Z'),after=before+1;
 const current=load(renderBlogFeed([post,news],[event,seminar],config,before));
 assert.equal(current('h3').filter((_,n)=>current(n).text()==='King of the South IX').length,1);
 assert.match(current('.post-date').first().text(),/3 October 2026/);
 assert.equal(renderBlogFeed([post,news],[event,seminar],config,before,true),'');
 const next=load(renderBlogFeed([post,news],[event,seminar],config,after));
 assert(!next.text().includes('King of the South'));assert(next.text().includes('Sunday seminar'));assert(next.text().includes('Team news'));
 const past=load(renderBlogFeed([post,news],[event,seminar],config,after,true));
 assert.equal(past('article').length,1);assert.equal(past('h3').text(),'King of the South IX');assert.equal(past('a').attr('href'),'/blog/king-of-the-south/');
 assert(!past.text().includes('25 September'));assert(!past.text().includes('Team news'));
 const sundayNoon=load(renderBlogFeed([post,news],[event,seminar],config,Date.parse(seminar.endsAt),true));assert.equal(sundayNoon('article').length,2);
});
