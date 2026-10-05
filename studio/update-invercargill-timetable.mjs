import fs from 'node:fs';
import assert from 'node:assert/strict';
import {getCliClient} from 'sanity/cli';
import {load} from 'cheerio';

// Transcribed from the Invercargill timetable image supplied by Brad on 3 October 2026.
// The image lists start times only; no session durations or end times are inferred.
const rows = [
  ['Monday', '5:15 pm', 'Kids BJJ', 'Ages 8–15'],
  ['Monday', '6:30 pm', 'Gi Class'],
  ['Tuesday', '6:00 am', 'AM Class'],
  ['Tuesday', '5:15 pm', 'Kids BJJ', 'Ages 4–7'],
  ['Tuesday', '5:30 pm', 'Fundamentals'],
  ['Tuesday', '6:30 pm', 'Open Mat'],
  ['Wednesday', '5:15 pm', 'Kids BJJ', 'Ages 8–15'],
  ['Wednesday', '6:30 pm', 'No-Gi Class'],
  ['Thursday', '6:00 am', 'AM Class'],
  ['Thursday', '5:15 pm', 'Kids BJJ', 'Ages 4–7'],
  ['Thursday', '5:30 pm', 'Fundamentals'],
  ['Thursday', '7:00 pm', 'Positional Rolling'],
  ['Friday', '6:30 pm', 'Leg Locks'],
  ['Saturday', '9:00 am', 'Kids Open Mat'],
  ['Saturday', '10:00 am', 'Adults Open Mat'],
];
const sessions = rows.map(([day, time, name, details], index) => ({
  _key: `invercargill-${day.toLowerCase()}-${index + 1}`,
  _type: 'classSession', day, time, name, ...(details ? {details} : {}),
}));
const client = getCliClient({apiVersion: '2025-02-19'}).withConfig({useCdn: false});
const ids = ['timetable-invercargill', 'drafts.timetable-invercargill'];
const current = await client.getDocuments(ids);
console.log(JSON.stringify(current.map((doc, index) => ({id: ids[index], revision: doc?._rev, published: doc?.published, sessions: doc?.sessions?.length || 0})), null, 2));
if (!process.argv.includes('--apply')) process.exit(0);

fs.writeFileSync('/private/tmp/cg-invercargill-timetable-backup.json', JSON.stringify(current, null, 2));
const fields = {
  published: true, sessions,
  note: 'Times may change for holidays, events and gradings. Check with the academy before your first visit.',
  reviewNotes: 'Transcribed from the Carlson Gracie Invercargill timetable image supplied by Brad on 3 October 2026. The image is undated and gives start times only. AM Class, Positional Rolling and Leg Locks retain the supplied names without assuming gi/no-gi or age restrictions. No Sunday sessions are listed.',
};
const transaction = client.transaction();
for (let index = 0; index < ids.length; index++) {
  const doc = current[index];
  if (doc) transaction.patch(ids[index], patch => patch.ifRevisionId(doc._rev).set(fields));
  else transaction.create({_id: ids[index], _type: 'academyTimetable', ...fields});
}
await transaction.commit();
const saved = await client.getDocuments(ids);
for (const doc of saved) {
  assert.equal(doc.published, true);
  assert.deepEqual(doc.sessions, sessions);
}

const pagePath = new URL('../locations/invercargill/index.html', import.meta.url);
const html = fs.readFileSync(pagePath, 'utf8');
const $ = load(html);
const local = [];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
$('#timetable .tt-col').each((_, column) => {
  const day = days[Number($(column).attr('data-day')) - 1];
  $(column).find('.tt-class').each((_, row) => local.push([
    day, $(row).find('.t').text(), $(row).find('.n').text(), ...($(row).find('.l').length ? [$(row).find('.l').text()] : []),
  ]));
});
assert.deepEqual(local, rows);
console.log('Verified all 15 sessions in published Sanity, the editable draft, and the local academy page.');
