import fs from 'node:fs';
import {load} from 'cheerio';
import {getCliClient} from 'sanity/cli';
import {createClient} from '@sanity/client';
import {sanityConfig} from '../cms/config.js';

const client = process.env.SANITY_API_TOKEN
  ? createClient({...sanityConfig,token:process.env.SANITY_API_TOKEN,useCdn:false})
  : getCliClient({apiVersion:'2025-02-19'});
if (!client.config().token) throw new Error('Run with `sanity exec seed-timetable-drafts.mjs --with-user-token` or set SANITY_API_TOKEN.');
const academies = [
  {id:'queenstown', notes:'Copied from the current Queenstown website preview. Please check every day, time and class name against the current Gymdesk schedule before showing this master timetable publicly.', liveUrl:'https://app.gymdesk.com/widgets/schedule/render/gym/DoKNw'},
  {id:'wanaka', notes:'Copied from the current Wānaka website preview. Please check every day, time and class name against the current Gymdesk schedule before showing this master timetable publicly.', liveUrl:'https://wanaka-martial-arts.gymdesk.com/schedule'},
  {id:'cromwell', notes:'Copied from the Cromwell academy’s 5 May Facebook schedule screenshot supplied by Brad. The year and whether this is still current need confirmation. Check every class with the local team before showing the master timetable publicly. Add the verified Gymdesk URL when available.', note:'Temporary timetable from the academy’s 5 May post. Confirm current times before visiting.'},
  {id:'invercargill', notes:'Copied from the Invercargill timetable image supplied by Brad on 3 October 2026: 15 weekly sessions, including kids classes at 5:15 pm, adult classes and Saturday open mats. The image is undated and gives start times only. Check for subsequent changes with the local team.'},
  {id:'south-canterbury', notes:'Copied from the South Canterbury academy’s 2 February 2025 Facebook schedule screenshot supplied by Brad. This is old and must be verified with the local team before showing the master timetable publicly. The screenshot lists adult sessions only; ask about current youth classes.', note:'Temporary timetable from the academy’s 2 February 2025 post. Confirm current times before visiting.'},
];
const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function existingSessions(id) {
  if (!['queenstown','wanaka','cromwell','invercargill','south-canterbury'].includes(id)) return [];
  const $ = load(fs.readFileSync(new URL(`../locations/${id}/index.html`,import.meta.url),'utf8'));
  const sessions=[];
  $('#timetable .tt-grid .tt-col[data-day]').each((_,column)=>{
    const day=dayNames[Number($(column).attr('data-day'))-1];
    $(column).find('.tt-class').each((index,item)=>{
      const row=$(item);
      sessions.push({_key:`${id}-${day.toLowerCase()}-${index+1}`,_type:'classSession',day,time:row.find('.t').first().text().trim(),name:row.find('.n').first().text().trim(),details:row.find('.l').first().text().trim()});
    });
  });
  if (!sessions.length) throw new Error(`No source sessions for ${id}`);
  return sessions;
}
const ids=academies.map(({id})=>`drafts.timetable-${id}`);
const current=await client.getDocuments(ids);
const missing=academies.filter((_,index)=>!current[index]);
console.log(`Existing drafts: ${academies.length-missing.length}; new drafts: ${missing.length}`);
for (const doc of current) if (doc) console.log(`${doc._id}: ${doc.sessions?.length || 0} sessions; website visibility ${doc.published ? 'ON' : 'OFF'}`);
for (const {id} of missing) console.log(`${id}: ${existingSessions(id).length} existing site sessions`);
if (!process.argv.includes('--apply')) process.exit(0);
const transaction=client.transaction();
for (const academy of missing) transaction.createIfNotExists({
  _id:`drafts.timetable-${academy.id}`,_type:'academyTimetable',published:false,
  sessions:existingSessions(academy.id),reviewNotes:academy.notes,
  ...(academy.note?{note:academy.note}:{}),
  ...(academy.liveUrl?{liveUrl:academy.liveUrl}:{})
});
if (missing.length) await transaction.commit();
const saved=await client.getDocuments(ids);
if (saved.some((doc,index)=>!doc || doc._id!==ids[index])) throw new Error('Draft verification failed');
console.log(`Verified ${saved.length} editable academy timetable drafts in Sanity.`);
