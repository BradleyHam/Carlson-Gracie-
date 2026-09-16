import React, {useEffect, useState} from 'react';
import {TextArea, Button} from '@sanity/ui';
import {set, useClient, useFormValue} from 'sanity';
const stack={display:'flex',flexDirection:'column',gap:12};
const paragraph={margin:0,fontSize:14,lineHeight:1.6};
export function TextListInput(props) {
 return <div style={{...stack,gap:24}}>{(props.value||[]).map(item=><div key={item._key}>
  <label style={{display:'block',marginBottom:8,fontSize:13,fontWeight:600,lineHeight:1.5}} htmlFor={props.id+'-'+item._key}>{item.label}</label>{/^(Call )?\+64 21 0230 4516$/.test(item.value||'')&&<p style={{...paragraph,marginBottom:8}}>The main phone number is managed in Website details.</p>}
  {!/^(Call )?\+64 21 0230 4516$/.test(item.value||'')&&<TextArea id={props.id+'-'+item._key} value={item.value||''} rows={item.value?.length>160?4:2} readOnly={props.readOnly || /^(Call )?\+64 21 0230 4516$/.test(item.value||'')} onChange={event=>props.onChange(set(event.currentTarget.value,[{_key:item._key},'value']))}/>}
 </div>)}</div>;
}
export function PageLinkInput(props) {
 const route=useFormValue(['route']);
 return <div style={stack}>{props.renderDefault(props)}{route&&<Button as="a" href={'https://carlson-gracie-eight.vercel.app'+route} target="_blank" rel="noopener" text="Open this page on the website" mode="ghost"/>}</div>;
}
export function UsageInput() {
 const client=useClient({apiVersion:'2025-02-19'});const id=useFormValue(['_id']);const notes=useFormValue(['reviewNotes']);const [pages,setPages]=useState(null);const [error,setError]=useState(false);
 useEffect(()=>{let live=true;setPages(null);setError(false);const base=String(id||'').replace(/^drafts\./,'');client.withConfig({useCdn:false,perspective:'published'}).fetch('*[_type=="sitePage" && references($id)]{title,route}',{id:base}).then(result=>{if(live)setPages(result)}).catch(()=>{if(live)setError(true)});return ()=>{live=false}},[client,id]);
 return <div style={{...stack,padding:16,border:'1px solid var(--card-border-color)',borderRadius:6}}>
  <p style={{...paragraph,fontWeight:600}}>Where this profile is used</p>
  <p style={paragraph}>{error?'Could not load the page list. You can still manage selections from Pages or Academies.':pages===null?'Checking published page selections…':pages.length?pages.map(p=>p.title).join(' · '):'Not selected on a published page yet.'}</p>
  {notes&&<p style={paragraph}><strong>Needs review:</strong> {notes}</p>}
  <p style={paragraph}>Publishing updates every placement. Page-specific details, if present, take priority. To remove just one placement, edit that page’s selection.</p>
 </div>;
}
export function OwnerGuide() {
 return <div style={{...stack,gap:28,padding:32,maxWidth:820,boxSizing:'border-box',overflowY:'auto',height:'100%'}}>
  <h1 style={{margin:0,fontSize:28,lineHeight:1.3}}>Manage your website</h1><p style={paragraph}>Start with what you want to change.</p>
  {[['Update a coach','Open Coaches. Edit one profile, then Publish. Pages select these shared profiles; you can change the selection and order in each page’s coaches section.'],['Update a seminar guest','Open Seminar guests. Keep their name, credentials and photo together. Choose which guests appear on Home and Seminars.'],['Add a dated event','Open Events → Upcoming & current → Create. Enter the date, location, booking link and photo, then Publish. Completed events move into Past events.'],['Edit a page','Open Pages or Academies and choose the page. Sections follow the website from top to bottom. Text is editable directly; photo entries show thumbnails.'],['Review missing details','Open Needs review. Existing differences and unconfirmed information are marked; no new facts have been assumed.'],['Publish safely','Edits stay in drafts until you Publish. Open the website to check the result; published updates can take a short time to appear.'],['Shared content and page-specific details','A profile is the main source for a person. Some existing pages had different wording or crops; these are preserved together on that profile under Page-specific details. Clear an optional override to use the main profile value.'],['Remove content','Removing a profile from a page affects only that page. Turn off Show on website on a profile to hide it everywhere. Strong references protect profiles that are still selected.'],['Class timetable','The timetable remains managed separately through the academy’s timetable workflow. Event dates do not change weekly classes.']].map(([title,body])=><section style={{...stack,gap:8,flexShrink:0}} key={title}><h2 style={{margin:0,fontSize:17,lineHeight:1.4}}>{title}</h2><p style={paragraph}>{body}</p></section>)}
 </div>;
}
