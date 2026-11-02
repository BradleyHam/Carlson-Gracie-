import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {extractBlogShell} from './posts-plugin.js';
import {escapeHTML as e} from './posts.js';

const articles = JSON.parse(readFileSync(new URL('./legacy/articles.json', import.meta.url), 'utf8'));
const galleries = JSON.parse(readFileSync(new URL('./legacy/galleries.json', import.meta.url), 'utf8'));
export function legacyArticlesPlugin() {
  return {
    name: 'carlson-legacy-articles',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const blog = bundle['blog/index.html'];
        if (!blog) throw new Error('Missing blog page for archive');
        const shell = extractBlogShell(String(blog.source));
        const $ = load(String(blog.source));
        const links = articles.map(a => `<li><a href="/news/${e(a.slug)}/">${e(a.title)}</a></li>`).join('');
        $('.blog-about').before(`<details class="blog-about"><summary>Explore the academy news archive</summary><ul>${links}</ul></details>`);
        blog.source = $.html();
        const galleryPage = (title, contents) => `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} | Carlson Gracie NZ</title><meta name="description" content="Photographs from the Carlson Gracie New Zealand academy archive.">${shell.head||''}<style>.legacy-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.legacy-gallery img{display:block;width:100%;height:auto}</style></head><body class="blog-page blog-article-page">${shell.nav||''}<main id="main-content"><header class="article-hero"><div class="wrap"><a class="article-back" href="/gallery/">← Photo archive</a><div class="article-heading"><h1 class="display">${e(title)}</h1></div></div></header><div class="wrap article-body">${contents}</div></main>${shell.footer||''}${shell.scripts||''}</body></html>`;
        const galleryLinks = galleries.map(g => `<li><a href="/gallery/${e(g.slug)}/">${e(g.title)}</a></li>`).join('');
        this.emitFile({type:'asset',fileName:'gallery/index.html',source:galleryPage('Photo gallery', `<p>Photographs from the academy archive.</p><ul>${galleryLinks}</ul>`)});
        for (const gallery of galleries) {
          const photos = gallery.images.map(img => `<a href="${e(img.src)}"><img src="${e(img.src)}" alt="${e(img.alt || gallery.title)}" loading="lazy"></a>`).join('');
          this.emitFile({type:'asset',fileName:`gallery/${gallery.slug}/index.html`,source:galleryPage(gallery.title, `<div class="legacy-gallery">${photos}</div>`)});
        }
        for (const a of articles) {
          const image = a.image ? `<figure class="article-cover"><img src="${e(a.image)}" alt="${e(a.imageAlt)}" loading="lazy"></figure>` : '';
          const html = `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(a.title)} | Carlson Gracie NZ</title><meta name="description" content="${e(a.description)}">${shell.head||''}</head><body class="blog-page blog-article-page">${shell.nav||''}<main id="main-content"><header class="article-hero"><div class="wrap"><a class="article-back" href="/blog/">← Back to the journal</a><div class="article-meta"><span>From the archive</span></div><div class="article-heading"><h1 class="display">${e(a.title)}</h1></div></div></header>${image}<div class="article-layout wrap"><aside class="article-side"><p class="eyebrow">From the academy archive</p><p>Carlson Gracie<br>New Zealand</p><a href="/blog/">All stories ↗</a></aside><article class="article-body">${a.body}</article></div></main>${shell.footer||''}${shell.scripts||''}</body></html>`;
          this.emitFile({type:'asset',fileName:`news/${a.slug}/index.html`,source:html});
        }
      }
    }
  };
}
