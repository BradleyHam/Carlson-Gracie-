import {renderBlogFeed,isPastEvent} from './blog-feed.js';
import fs from 'node:fs';
import {fetchContent,eventsQuery,imageURL} from './shared.js';
import {sanityConfig} from './config.js';
import {postsQuery,validSlug,renderPostCards,renderPostPage,postPath,escapeHTML,dateLabel} from './posts.js';
import {load} from 'cheerio';
export function extractBlogShell(html){
 const $=load(html);
 for(const el of $('[href], [src]').toArray())for(const attr of ['href','src']){
  const value=$(el).attr(attr);
  if(value && !/^(?:[a-z]+:|#|\/)/i.test(value))$(el).attr(attr,new URL(value,'https://local.test/blog/').pathname);
 }
 return {head:$('head link:not([rel=canonical])').toArray().map(el=>$.html(el)).join(''),nav:$.html($('body > nav')),footer:$.html($('body > footer')),scripts:$('script[src]').toArray().map(el=>$.html(el)).join('')};
}
export function blogPlugin(){
 let posts=[],events=[];
 const getPosts=async()=>{const data=await fetchContent(sanityConfig,postsQuery,{}, {cdn:false});if(!Array.isArray(data))throw new Error('Invalid blog response');const seen=new Set();return data.filter(p=>validSlug(p.slug?.current)).map(p=>{if(seen.has(p.slug.current))throw new Error('Duplicate blog address: '+p.slug.current);seen.add(p.slug.current);return p;});};
 return {name:'carlson-blog',async buildStart(){posts=await getPosts();events=await fetchContent(sanityConfig,eventsQuery,{}, {cdn:false}) || [];},
 configureServer(server){server.middlewares.use(async(req,res,next)=>{const path=req.url?.split('?')[0];const match=/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(path||'');if(!match)return next();try{const slug=match[1];const post=(await getPosts()).find(p=>p.slug.current===slug);res.setHeader('Content-Type','text/html; charset=utf-8');res.statusCode=post?200:404;const template=fs.readFileSync(new URL('../blog/index.html',import.meta.url),'utf8');const shell=extractBlogShell(await server.transformIndexHtml('/blog/index.html',template));res.end(post?renderPostPage(post,sanityConfig,shell):'<h1>Article not found</h1><a href="/blog/">Back to Blog</a>');}catch(error){next(error);}});},
 transformIndexHtml:{order:'post',handler(html,ctx){const home=ctx.path==='/'||ctx.path==='/index.html';const blog=ctx.path==='/blog/'||ctx.path==='/blog/index.html';if(!home&&!blog)return html;const $=load(html);const list=home?posts.filter(p=>!p.event||!isPastEvent(p.event)).slice(0,1):posts;$(home?'.post-grid':'#blog-posts, .journal-feed:not(#blog-past-posts)').html(home?renderPostCards(list,sanityConfig,true):renderBlogFeed(posts,events,sanityConfig));if(blog){const data=JSON.stringify([posts,events]).replace(/</g,'\\u003c');$('body').append('<script type="application/json" id="blog-snapshot">'+data+'</script>');const past=renderBlogFeed(posts,events,sanityConfig,Date.now(),true);$('#blog-past-posts').html(past);if(past)$('#blog-past').removeAttr('hidden');else $('#blog-past').attr('hidden','');}if(home){const upcoming=events.filter(e=>e.featured && !list.some(p=>imageURL(p.cover,sanityConfig)?.split('?')[0]===e.image?.split('?')[0]) && Date.parse(e.endsAt||e.startsAt)>=Date.now()).slice(0,3);$('.home-upcoming').remove();if(upcoming.length)$('.post-grid').after('<div class="home-upcoming">'+upcoming.map(e=>'<article class="home-event">'+(/^https:\/\/cdn\.sanity\.io\/images\//.test(e.image||'')?'<div class="home-event-image"><img src="'+escapeHTML(e.image)+'" alt="'+escapeHTML(e.imageAlt||e.title)+'" loading="lazy"></div>':'')+'<div class="home-event-content"><div class="home-event-date"><span>Upcoming '+escapeHTML(e.category||'event')+'</span><strong>'+escapeHTML(dateLabel(e.startsAt))+'</strong></div><h3>'+escapeHTML(e.title)+'</h3><p>'+escapeHTML(e.summary)+'</p><a class="post-more" href="/seminars/events/">View event details &rarr;</a></div></article>').join('')+'</div>');}return $.html();}},
 generateBundle:{order:'post',handler(options,bundle){const page=bundle?.['blog/index.html'];if(bundle&&!page)throw new Error('Missing built blog shell');const shell=page?extractBlogShell(String(page.source)):{};for(const post of posts)this.emitFile({type:'asset',fileName:postPath(post).slice(1)+'index.html',source:renderPostPage(post,sanityConfig,shell)});}}
 };
}
