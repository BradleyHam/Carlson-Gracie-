import {settingLinkKey, settingHref, originalPhonePattern} from './settings.js';
import {resolvePageProfiles, allPagesQuery} from './profiles.js';
import path from 'node:path';
import {renderSeminars} from './seminars.js';
import {renderCoaches} from './coaches.js';
import {load} from 'cheerio';
import {sanityConfig} from './config.js';
import {fetchContent, imageURL, isConfigured, eventsQuery} from './shared.js';
import manifest from './manifest.json' with {type:'json'};

export function sanityContentPlugin() {
  let root;
  let documents = new Map();
  let eventSnapshot = null;
  return {
    name: 'carlson-sanity-content',
    configResolved(config) { root = config.root; },
    async buildStart() {
      if (!isConfigured(sanityConfig)) return;
      // A configured production build must not silently publish stale content.
      const [docs, events] = await Promise.all([
        fetchContent(sanityConfig, allPagesQuery, {}, {cdn:false}),
        fetchContent(sanityConfig, eventsQuery, {}, {cdn:false}),
      ]);
      if (!Array.isArray(events)) throw new Error('Invalid Sanity events response');
      eventSnapshot = events;
      if (!Array.isArray(docs)) throw new Error('Invalid Sanity pages response');
      documents = new Map(docs.map(doc => [doc._id, resolvePageProfiles(doc)]));
    },
    resolveId(id) { if (id === 'virtual:sanity-events') return '\0sanity-events'; },
    load(id) { if (id === '\0sanity-events') return 'export default ' + JSON.stringify(eventSnapshot) + ';'; },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const file = path.relative(root, context.filename).split(path.sep).join('/');
        const page = manifest.find(page => page.file === file);
        if (!page) return html; // Includes the entire timetable route.
        const $ = load(html);
        const published = documents.get(page._id);
        const texts = new Map((published?.sections || []).flatMap(s => s.texts || []).map(t => [t._key, t.value]));
        const images = new Map((published?.sections || []).flatMap(s => s.images || []).map(i => [i._key, i]));
        $('html').attr('data-sanity-page', page._id);
        if (published?.seoTitle) $('title').text(published.seoTitle);
        if (typeof published?.seoDescription === 'string') $('meta[name="description"]').attr('content', published.seoDescription);
        for (const section of page.sections) {
          for (const item of section.texts) {
            const el = $(item.selector);
            if (el.length !== 1) throw new Error('CMS binding no longer matches: ' + file + ': ' + item.label);
            el.attr('data-sanity-text', item._key);
            const value = texts.get(item._key);
            if (typeof value === 'string' && value !== item.value) {
              el.empty();
              value.split('\n').forEach((line, i) => { if (i) el.append('<br>'); el.append($('<span>').text(line).contents()); });
            }
          }
          for (const item of section.images) {
            const el = $(item.selector);
            if (el.length !== 1) throw new Error('CMS image binding no longer matches: ' + file + ': ' + item.label);
            el.attr('data-sanity-image', item._key);
            const image = images.get(item._key);
            const url = imageURL(image?.image, sanityConfig);
            if (url) el.attr('src', url).removeAttr('srcset').removeAttr('sizes');
            if (typeof image?.alt === 'string') el.attr('alt', image.alt);
          }
        }
        for (const section of page.sections.filter(s => s.coachSelector)) {
          const rail = $(section.coachSelector);
          rail.attr('data-sanity-coaches', section._key);
          const coaches = published?.sections?.find(s => s._key === section._key)?.coaches;
          const markup = renderCoaches(coaches, sanityConfig);
          if (markup !== null) rail.html(markup);
        }
        for (const section of page.sections.filter(s => s.seminarSelector)) {
          const rail = $(section.seminarSelector);
          rail.attr('data-sanity-seminars', section._key).attr('data-seminar-layout',section.seminarLayout);
          const entries = published?.sections?.find(s => s._key === section._key)?.seminars;
          const markup = renderSeminars(entries, sanityConfig, section.seminarLayout);
          if (markup !== null) rail.html(markup);
        }
        $('body *').not('script,style').each((_,node)=>{
          const el=$(node);const phoneNodes=el.contents().filter((_,n)=>n.type==='text' && /\+64 21 0230 4516|021 0230 4516/.test(n.data));
          if(!phoneNodes.length||el.closest('#timetable').length)return;
          el.attr('data-sanity-phone',published?.settings?.phone||'');
          if(published?.settings?.phone)phoneNodes.each((_,n)=>{n.data=n.data.replace(originalPhonePattern,published.settings.phone);});
        });
        $('a[href]').each((_,node)=>{
          const el=$(node);const key=settingLinkKey(el.attr('href'));if(!key)return;
          el.attr('data-sanity-setting',key);const href=settingHref(published?.settings,key);if(href)el.attr('href',href);
          if(key==='phone'&&published?.settings?.phone){el.contents().filter((_,n)=>n.type==='text').each((_,n)=>{n.data=n.data.replace(/\+64 21 0230 4516|021 0230 4516/g,published.settings.phone);});}
        });
        return {html: $.html(), tags:[{tag:'script',attrs:{type:'module',src:'/cms/browser.js'},injectTo:'head'}]};
      },
    },
  };
}
