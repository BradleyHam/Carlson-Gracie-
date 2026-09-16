import {fetchContent} from './shared.js';
import {sanityConfig} from './config.js';
import {postsQuery,validSlug,renderPostCards,renderPostPage,postPath} from './posts.js';
import {load} from 'cheerio';
export function blogPlugin(){
 let posts=[];
 const getPosts=async()=>{const data=await fetchContent(sanityConfig,postsQuery,{}, {cdn:false});if(!Array.isArray(data))throw new Error('Invalid blog response');const seen=new Set();return data.filter(p=>validSlug(p.slug?.current)).map(p=>{if(seen.has(p.slug.current))throw new Error('Duplicate blog address: '+p.slug.current);seen.add(p.slug.current);return p;});};
 return {name:'carlson-blog',async buildStart(){posts=await getPosts();},
 configureServer(server){server.middlewares.use(async(req,res,next)=>{if(!req.url?.startsWith('/blog/'))return next();try{const slug=req.url.split('?')[0].split('/')[2];const post=(await getPosts()).find(p=>p.slug.current===slug);res.setHeader('Content-Type','text/html; charset=utf-8');res.statusCode=post?200:404;res.end(post?renderPostPage(post,sanityConfig):'<h1>Article not found</h1><a href="/seminars/news/">Back to News</a>');}catch(error){next(error);}});},
 transformIndexHtml:{order:'post',handler(html,ctx){const home=ctx.path==='/'||ctx.path==='/index.html';const category=/\/seminars\/news\//.test(ctx.path)?'News':/\/seminars\/technique\//.test(ctx.path)?'Technique':null;if(!home&&!category)return html;const $=load(html);const list=category?posts.filter(p=>p.category===category):posts.slice(0,3);$(home?'.post-grid':'.journal-feed').html(renderPostCards(list,sanityConfig,home));return $.html();}},
 generateBundle(){for(const post of posts)this.emitFile({type:'asset',fileName:postPath(post).slice(1)+'index.html',source:renderPostPage(post,sanityConfig)});}
 };
}
