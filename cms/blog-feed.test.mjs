import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {renderBlogFeed} from './blog-feed.js';
test('published events populate seminar filters safely without requiring a matching blog post',()=>{
 const event={title:'Guest <coach>',category:'Seminar',startsAt:'2026-10-03T20:00:00Z',summary:'Kids and adults',image:'https://cdn.sanity.io/images/a/b/poster.jpg'};
 const $=load(renderBlogFeed([], [event],{}));assert.equal($('[data-category="Seminars"]').length,1);assert.equal($('h3').text(),'Guest <coach>');assert.equal($('coach').length,0);assert.equal($('img').length,1);assert.match($.text(),/4 October 2026/);
 assert(!renderBlogFeed([],[],{}).includes('journal-event'));
});
