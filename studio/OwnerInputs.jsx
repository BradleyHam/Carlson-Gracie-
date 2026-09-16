import React, {useEffect, useState} from 'react';
import {Card, Stack, Text, TextArea, Button, Flex} from '@sanity/ui';
import {set, useClient, useFormValue} from 'sanity';
export function TextListInput(props) {
 return <Stack space={4}>{(props.value||[]).map(item=><Stack space={2} key={item._key}>
  <Text size={1} weight="semibold"><label htmlFor={props.id+'-'+item._key}>{item.label}</label></Text>
  <TextArea id={props.id+'-'+item._key} value={item.value||''} rows={item.value?.length>160?4:2} readOnly={props.readOnly} onChange={event=>props.onChange(set(event.currentTarget.value,[{_key:item._key},'value']))}/>
 </Stack>)}</Stack>;
}
export function PageLinkInput(props) {
 const route=useFormValue(['route']);
 return <Stack space={3}>{props.renderDefault(props)}{route&&<Button as="a" href={'https://carlson-gracie-eight.vercel.app'+route} target="_blank" rel="noopener" text="Open this page on the website" mode="ghost"/>}</Stack>;
}
export function UsageInput(props) {
 const client=useClient({apiVersion:'2025-02-19'});const id=useFormValue(['_id']);const notes=useFormValue(['reviewNotes']);const [pages,setPages]=useState([]);
 useEffect(()=>{let live=true;const base=String(id||'').replace(/^drafts\./,'');client.fetch('*[_type=="sitePage" && !(_id in path("drafts.**")) && references($id)]{title,route}',{id:base}).then(result=>{if(live)setPages(result)}).catch(()=>{});return ()=>{live=false}},[client,id]);
 return <Card padding={3} tone="primary" radius={2}><Stack space={3}><Text weight="semibold" size={1}>Where this profile is used</Text><Text size={1}>{pages.length?pages.map(p=>p.title).join(' · '):'Not selected on a published page yet.'}</Text>{notes&&<Text size={1}>Needs review: {notes}</Text>}<Text size={1}>Publishing updates every placement. Page-specific details, if present, take priority. To remove just one placement, edit that page’s selection.</Text></Stack></Card>;
}
export function OwnerGuide() {
 return <Card padding={5}><Stack space={5}>
  <Text size={4} weight="bold">Manage your website</Text>
  <Text>Start with what you want to change.</Text>
  {[['Update a coach','Open Coaches. Edit one profile, then Publish. Pages select these shared profiles; you can change the selection and order in each page’s coaches section.'],['Update a seminar guest','Open Seminar guests. Keep their name, credentials and photo together. Choose which guests appear on Home and Seminars.'],['Add a dated event','Open Events → Upcoming & current → Create. Enter the date, location, booking link and photo, then Publish. Completed events move into Past events.'],['Edit a page','Open Pages or Academies and choose the page. Sections follow the website from top to bottom. Text is editable directly; photo entries show thumbnails.'],['Review missing details','Open Needs review. Existing differences and unconfirmed information are marked; no new facts have been assumed.'],['Publish safely','Edits stay in drafts until you Publish. Open the website to check the result; published updates can take a short time to appear.'],['Shared content and page-specific details','A profile is the main source for a person. Some existing pages had different wording or crops; these are preserved together on that profile under Page-specific details. Clear an optional override to use the main profile value.'],['Remove content','Removing a profile from a page affects only that page. Turn off Show on website on a profile to hide it everywhere. Strong references protect profiles that are still selected.'],['Class timetable','The timetable remains managed separately through the academy’s timetable workflow. Event dates do not change weekly classes.']].map(([title,body])=><Stack space={2} key={title}><Text weight="semibold">{title}</Text><Text>{body}</Text></Stack>)}
 </Stack></Card>;
}
