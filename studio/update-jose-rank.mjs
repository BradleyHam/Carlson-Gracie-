import {getCliClient} from 'sanity/cli';
const client = getCliClient({apiVersion:'2025-02-19'});
const role = 'Head professor · 4th degree black belt';
// Keep any in-progress biography edits intact and prevent a draft from restoring the old rank.
const ids = ['coach-jose-gomes', 'drafts.coach-jose-gomes'];
const docs = (await Promise.all(ids.map(id => client.getDocument(id)))).filter(Boolean);
if (!docs.some(doc => doc._id === ids[0])) throw new Error('Published Jose profile not found');
let transaction = client.transaction();
for (const doc of docs) {
  if (doc.name !== 'Jose Gomes') throw new Error('Unexpected coach identity');
  const pageCopy = (doc.pageCopy || []).map(item => ({...item, ...(item.role ? {role} : {}), ...(item.stripes !== undefined ? {stripes:4} : {})}));
  transaction = transaction.patch(doc._id, patch => patch.ifRevisionId(doc._rev).set({role, stripes:4, pageCopy}));
}
await transaction.commit();
for (const original of docs) {
  const saved = await client.getDocument(original._id);
  if (saved.role !== role || saved.stripes !== 4 || saved.pageCopy?.some(item => item.role && item.role !== role)) throw new Error('Rank verification failed');
  if (saved.bio !== original.bio || saved.fullBio !== original.fullBio) throw new Error('Unexpected biography change');
  console.log('Verified fourth degree rank:', saved._id);
}
