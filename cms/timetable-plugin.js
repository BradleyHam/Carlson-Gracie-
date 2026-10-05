import path from 'node:path';
import fs from 'node:fs';
import {load} from 'cheerio';
import {sanityConfig} from './config.js';
import {fetchContent, isConfigured} from './shared.js';
import {academyIds, timetableQuery, liveScheduleUrl, publishedSessions, renderWeeklyTimetable, timetableNote, renderLiveScheduleLink, classType} from './timetables.js';

export function timetablePlugin() {
  let root;
  let timetables = new Map();
  return {
    name: 'carlson-academy-timetables',
    configResolved(config) { root = config.root; },
    async buildStart() {
      if (!isConfigured(sanityConfig)) return;
      const docs = await fetchContent(sanityConfig, timetableQuery, {}, {cdn:false});
      if (!Array.isArray(docs)) throw new Error('Invalid academy timetable response');
      timetables = new Map(docs.map(doc => [doc._id, doc]));
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const file = path.relative(root, context.filename).split(path.sep).join('/');
        if (file === 'training/timetable/index.html') {
          const $ = load(html);
          const destination = $('#academy-schedules');
          if (destination.length !== 1) throw new Error('Timetable directory target missing');
          const names = {queenstown:'Queenstown',wanaka:'Wānaka',cromwell:'Cromwell',invercargill:'Invercargill','south-canterbury':'South Canterbury'};
          for (const academy of academyIds) {
            const source = load(fs.readFileSync(path.join(root,'locations',academy,'index.html'),'utf8'));
            const doc = timetables.get('timetable-'+academy);
            const published = renderWeeklyTimetable(doc);
            const grid = published ? load(published)('.tt-grid').first() : source('#timetable .tt-grid').first();
            if (!grid.length) throw new Error('No weekly classes for '+academy);
            grid.addClass('location-tt-grid--four');
            grid.find('.tt-class').each((_,row) => {
              const name = grid.find(row).find('.n').first().text();
              const details = grid.find(row).find('.l').first().text();
              grid.find(row).attr('data-class-type',classType(name,details));
            });
            const block = $('<section class="academy-schedule"></section>').attr('data-academy',academy).attr('id','schedule-'+academy);
            const header = $('<div class="academy-schedule-head"></div>');
            header.append($('<div></div>').append($('<p class="eyebrow"></p>').text('Academy timetable'),$('<h2 class="display"></h2>').text(names[academy])));
            header.append($('<a class="academy-schedule-link"></a>').attr('href','/locations/'+academy+'/').text('Explore academy →'));
            block.append(header);
            block.append($(grid.toString()));
            const note = published ? timetableNote(doc) : source('#timetable .tt-note').first().text().trim();
            if (note) block.append($('<p class="tt-note"></p>').text(note));
            const live = renderLiveScheduleLink(liveScheduleUrl(doc,academy));
            if (live) block.append($('<div class="academy-schedule-live"></div>').html(live));
            destination.append(block);
          }
          return $.html();
        }
        const match = /^locations\/([a-z-]+)\/index\.html$/.exec(file);
        const academy = match?.[1];
        if (!academyIds.includes(academy)) return html;
        const $ = load(html);
        const section = $('#timetable[data-academy-timetable]');
        if (section.length !== 1) throw new Error('Academy timetable section missing: ' + file);
        const doc = timetables.get('timetable-'+academy);
        const markup = renderWeeklyTimetable(doc);
        if (markup) {
          const old = section.find('.tt-grid, .num-blocks, .timetable-fallback').first();
          if (old.length) old.replaceWith(markup);
          else section.find('.wrap').append(markup);
          section.find('.tt-legend').remove();
          section.find('h2').first().text('Weekly classes');
          section.find('.lead').first().text('The local academy maintains this weekly timetable. Check with the team before your first visit.');
          const note = section.find('.tt-note').first();
          if (note.length) note.text(timetableNote(doc));
          else section.find('[data-sanity-timetable-content]').after('<p class="tt-note">'+$('<span>').text(timetableNote(doc)).html()+'</p>');
          section.attr('data-timetable-revision', doc._rev || '');
        }
        const link = liveScheduleUrl(doc,academy);
        const target = section.find('[data-live-schedule-link]');
        if (target.length) target.html(renderLiveScheduleLink(link));
        // The live callout already explains routine schedule changes.
        if (section.find('.tt-live-callout').length) {
          section.find('.tt-note').each((_, el) => {
            if (/^Times can shift around holidays, events and gradings\. Check before your first visit\.$/.test($(el).text().trim())) $(el).remove();
          });
        }
        return $.html();
      },
    },
  };
}
