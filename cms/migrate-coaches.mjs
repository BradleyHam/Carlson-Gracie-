import fs from 'node:fs';
import assert from 'node:assert/strict';
import manifest from './manifest.json' with {type:'json'};
import {sanityConfig} from './config.js';
export function migrateCoachPage(doc) {
  const page=manifest.find(p=>p._id===doc._id.replace(/^drafts\./,''));
  const result=structuredClone(doc);
  for(const section of result.sections||[]) {
    const config=page?.sections.find(s=>s._key===section._key&&s.coachBindings);
    if(!config||Object.hasOwn(section,'coaches')||Object.hasOwn(section,'coachRefs'))continue;
    const texts=new Map(section.texts.map(t=>[t._key,t.value]));const images=new Map(section.images.map(i=>[i._key,i]));
    section.coaches=config.coachBindings.map(b=>{const image=images.get(b.photo);assert.ok(texts.has(b.name)&&image?.image?.asset?._ref,'Missing existing coach content');return {_key:b._key,_type:'coach',name:texts.get(b.name),role:texts.get(b.role)||'',bio:texts.get(b.bio)||'',photo:image.image,alt:image.alt||'',belt:b.belt,stripes:b.stripes};});
    const usedTexts=new Set(config.coachBindings.flatMap(b=>[b.name,b.role,b.bio]));const usedImages=new Set(config.coachBindings.map(b=>b.photo));
    section.texts=section.texts.filter(t=>!usedTexts.has(t._key));section.images=section.images.filter(i=>!usedImages.has(i._key));
  }
  return result;
}
if(process.argv.includes('--apply')){
 const token=process.env.SANITY_API_TOKEN;if(!token)throw new Error('SANITY_API_TOKEN is required.');
 const base=`https://${sanityConfig.projectId}.api.sanity.io/v${sanityConfig.apiVersion}/data/`;
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const q='*[_type=="sitePage" && _id in ["page-home","page-about-coaches","drafts.page-home","drafts.page-about-coaches"]]';
 const read=async()=>{const r=await fetch(base+'query/'+sanityConfig.dataset+'?perspective=raw&query='+encodeURIComponent(q),{headers});if(!r.ok)throw new Error('Read '+r.status);return (await r.json()).result;};
 const docs=await read();assert.ok(docs.some(d=>d._id==='page-home'));assert.ok(docs.some(d=>d._id==='page-about-coaches'));
 const backup=process.env.COACH_MIGRATION_BACKUP;if(!backup)throw new Error('Set COACH_MIGRATION_BACKUP to a backup file path.');fs.writeFileSync(backup,JSON.stringify(docs,null,2));
 const updates=docs.map(migrateCoachPage);const mutations=updates.map((d,i)=>({patch:{id:d._id,ifRevisionID:docs[i]._rev,set:{sections:d.sections}}})).filter((m,i)=>JSON.stringify(updates[i].sections)!==JSON.stringify(docs[i].sections));
 if(mutations.length){const r=await fetch(base+'mutate/'+sanityConfig.dataset,{method:'POST',headers,body:JSON.stringify({mutations})});if(!r.ok)throw new Error('Migration '+r.status+' '+await r.text());}
 const saved=await read();for(const d of updates)assert.deepEqual(saved.find(x=>x._id===d._id).sections,d.sections);console.log('Verified coach objects for',saved.map(d=>d._id).join(', '));
}
