import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {renderBody,renderPostCards,renderPostPage,validSlug} from './posts.js';
import {blogPlugin} from './posts-plugin.js';
const config={projectId:'i27dttcu',dataset:'production'};
const post={_id:'test',title:'A lesson <script>alert(1)</script>',slug:{current:'a-lesson'},category:'Technique',publishedAt:'2026-09-15T00:00:00Z',excerpt:'A short introduction.',cover:{asset:{_ref:'image-abc-800x600-jpg'},alt:'Training'},body:[{_type:'block',style:'normal',children:[{text:'First paragraph',marks:[]}]},{_type:'block',style:'h2',children:[{text:'The detail'}]}]};
test('articles render safe rich text, image descriptions, links and lists',()=>{
 const html=renderBody([{_type:'block',children:[{text:'<script>',marks:['bad','strong']}],markDefs:[{_key:'bad',href:'javascript:alert(1)'}]},{_type:'block',listItem:'bullet',children:[{text:'One'}]},{_type:'block',listItem:'bullet',children:[{text:'Two'}]},{_type:'image',asset:{_ref:'image-abc-800x600-jpg'},alt:'An & image',caption:'Caption'}],config);
 assert(!html.includes('javascript:'));assert(!html.includes('<script>'));assert(html.includes('<ul><li>One</li><li>Two</li></ul>'));assert(html.includes('An &amp; image'));
 const $=load(renderPostPage(post,config));assert.equal($('h1').text(),post.title);assert.equal($('script').length,0);assert.equal($('.article-body h2').text(),'The detail');assert.equal($('meta[name="description"]').attr('content'),post.excerpt);
 assert(validSlug('a-lesson'));assert(!validSlug('../escape'));assert(renderPostCards([],config).includes('No articles published'));assert(renderPostCards([post],config).includes('/blog/a-lesson/'));
});
test('published snapshot generates article routes, filters categories and clears removed posts',async()=>{
 const original=global.fetch;let data=[post,{...post,_id:'news',category:'News',slug:{current:'team-news'}}];global.fetch=async url=>{assert.equal(new URL(url).searchParams.get('perspective'),'published');return {ok:true,json:async()=>({result:data})};};
 try{const plugin=blogPlugin();await plugin.buildStart();const emitted=[];plugin.generateBundle.handler.call({emitFile:file=>emitted.push(file)});assert.deepEqual(emitted.map(f=>f.fileName),['blog/a-lesson/index.html','blog/team-news/index.html']);const html=plugin.transformIndexHtml.handler('<div class="journal-feed">Placeholder</div>',{path:'/blog/index.html'});assert(html.includes('/blog/team-news/'));assert(html.includes('/blog/a-lesson/'));const home=plugin.transformIndexHtml.handler('<div class="post-grid">Placeholder</div>',{path:'/index.html'});assert(home.includes('/blog/a-lesson/'));assert(!home.includes('/blog/team-news/'));data=[];await plugin.buildStart();const empty=[];plugin.generateBundle.handler.call({emitFile:f=>empty.push(f)});assert.equal(empty.length,0);assert(plugin.transformIndexHtml.handler('<div class="post-grid">Placeholder</div>',{path:'/index.html'}).includes('Stories from the academy'));}finally{global.fetch=original;}
});
test('article shell keeps the logo, menus and bundled assets at nested routes',async()=>{
 const {extractBlogShell}=await import('./posts-plugin.js');
 const shell=extractBlogShell('<head><link rel="canonical" href="https://example.com/blog/"><link rel="stylesheet" href="./blog.css"></head><body><nav><a class="wordmark" href="../"><img src="../assets/cg-logo.png"></a><ul class="nav-links"><li><a href="../training/">Training</a></li></ul></nav><footer>Academy</footer><script type="module" src="../mobile-nav.js"></script></body>');
 const $=load(renderPostPage(post,config,shell));
 assert.equal($('nav .wordmark img').attr('src'),'/assets/cg-logo.png');
 assert.equal($('nav a').last().attr('href'),'/training/');
 assert.equal($('script[type="module"]').attr('src'),'/mobile-nav.js');
 assert.equal($('link[rel="stylesheet"]').attr('href'),'/blog/blog.css');
 assert.equal($('link[rel="canonical"]').length,0);
 assert.equal($('.article-cover img').attr('alt'),'Training');
});
