import fs from 'node:fs';
import {sanityConfig} from './config.js';
import {isConfigured} from './shared.js';
if (!isConfigured(sanityConfig)) throw new Error('Set cms/config.js to the approved Carlson Gracie project first.');
const token=process.env.SANITY_API_TOKEN;
if(!token) throw new Error('Set SANITY_API_TOKEN in this shell only. Never use a VITE_ variable.');
const documents=['./shared-seed.ndjson','./seed.ndjson'].flatMap(file=>fs.readFileSync(new URL(file,import.meta.url),'utf8').trim().split('\n').map(JSON.parse));
// Repeatable import: never overwrite an owner edit or an existing document.
for(let i=0;i<documents.length;i+=10) {
  const mutations=documents.slice(i,i+10).map(doc=>({createIfNotExists:doc}));
  const response=await fetch('https://' + sanityConfig.projectId + '.api.sanity.io/v' + sanityConfig.apiVersion + '/data/mutate/' + sanityConfig.dataset,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({mutations}),signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error('Import failed: HTTP ' + response.status);
}
console.log('Imported existing pages without overwriting existing content. Example events were not imported.');
