import {load} from 'cheerio';

const origin = 'https://carlsongraciebjj.co.nz';
const pathForFile = file => file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, '');
const xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Run after the blog plugin has emitted the individual articles.
export function seoPlugin() {
  return {
    name: 'carlson-search-metadata',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const paths = [];
        for (const [file, item] of Object.entries(bundle)) {
          if (item.type !== 'asset' || !file.endsWith('index.html')) continue;
          const path = pathForFile(file);
          const $ = load(String(item.source));
          $('link[rel="canonical"]').remove();
          $('head').append('<link rel="canonical" href="' + origin + path + '">');
          item.source = $.html();
          paths.push(path);
        }
        paths.sort();
        this.emitFile({type:'asset', fileName:'sitemap.xml', source:'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + paths.map(path => '  <url><loc>' + xml(origin + path) + '</loc></url>').join('\n') + '\n</urlset>\n'});
        this.emitFile({type:'asset', fileName:'robots.txt', source:'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n'});
      }
    }
  };
}
