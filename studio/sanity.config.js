import {postType} from './post.js';
import {TextListInput, PageLinkInput, UsageInput, OwnerGuide} from './OwnerInputs.jsx';
import {defineConfig, defineType, defineField} from 'sanity';
import {structureTool} from 'sanity/structure';
import {sanityConfig} from '../cms/config.js';
import manifest from '../cms/manifest.json';

const fixed = {disableActions:['add','remove','duplicate','copy','sort']};
const label = defineField({name:'label',title:'On the website',type:'string',readOnly:true,hidden:true});
const required = rule => rule.required();
const schemaTypes = [postType,
  defineType({name:'seminarGuest',title:'Seminar guest',type:'object',fields:[
    defineField({name:'name',title:'Guest name',type:'string',validation:required}),
    defineField({name:'photo',title:'Seminar photo',type:'image',validation:required}),
    defineField({name:'alt',title:'Photo description',type:'string',description:'Describe who or what is pictured.'}),
    defineField({name:'description',title:'Short description / credentials',type:'string',description:'The line below the guest’s name, for example UFC Hall of Famer.'}),
  ],preview:{select:{title:'name',subtitle:'description',media:'photo'}}}),
  defineType({name:'coach',title:'Coach',type:'object',fields:[
    defineField({name:'name',title:'Name',type:'string',validation:required}),
    defineField({name:'photo',title:'Photo',type:'image',validation:required}),
    defineField({name:'alt',title:'Photo description',type:'string',description:'Describe the coach photo for visitors who cannot see it.'}),
    defineField({name:'role',title:'Role / rank',type:'string',description:'The short line below their name.'}),
    defineField({name:'bio',title:'Short bio',type:'text',rows:4}),
    defineField({name:'belt',title:'Belt colour',type:'string',initialValue:'unconfirmed',options:{list:[{title:'Not confirmed',value:'unconfirmed'},...['white','blue','purple','brown','black'].map(value=>({title:value[0].toUpperCase()+value.slice(1),value}))]},description:'Controls the belt shown on their card.'}),
    defineField({name:'stripes',title:'Stripes / degrees',type:'number',initialValue:0,validation:rule=>rule.integer().min(0).max(10)}),
  ],preview:{select:{title:'name',subtitle:'role',media:'photo'}}}),
  defineType({name:'pageText',title:'Copy',type:'object',fields:[label,defineField({name:'value',title:'Text',type:'text',rows:3,validation:required})],preview:{select:{title:'label',subtitle:'value'}}}),
  defineType({name:'pageImage',title:'Photo',type:'object',fields:[label,defineField({name:'image',title:'Website photo',type:'image',description:'This is the photo used in this position on the website. Choose Upload or Select to replace it. Removing it restores the original website photo.'}),defineField({name:'alt',title:'Photo description',type:'string',description:'Describe the photo for visitors who cannot see it.'}),defineField({name:'originalSrc',type:'string',hidden:true,readOnly:true})],preview:{select:{title:'label',subtitle:'alt',media:'image'}}}),
  defineType({name:'pageSection',title:'Page section',type:'object',fields:[label,defineField({name:'coachRefs',title:'Coaches shown here',type:'array',of:[{type:'reference',to:[{type:'coachProfile'}]}],validation:rule=>rule.unique(),hidden:({parent})=>!Object.hasOwn(parent||{},'coachRefs'),description:'Choose shared coach profiles and drag to reorder. Edit the profile under Coaches to update its details everywhere. Removing an entry here removes only this placement.'}),defineField({name:'seminarRefs',title:'Seminar guests shown here',type:'array',of:[{type:'reference',to:[{type:'seminarProfile'}]}],validation:rule=>rule.unique(),hidden:({parent})=>!Object.hasOwn(parent||{},'seminarRefs'),description:'Choose shared guest profiles and drag to reorder. Edit their photos and details under Seminar guests.'}),defineField({name:'seminars',title:'Seminar guests',type:'array',of:[{type:'seminarGuest'}],hidden:({parent})=>!Object.hasOwn(parent || {},'seminars') || Object.hasOwn(parent || {},'seminarRefs'),description:'Each entry keeps the guest name, photo and description together. Add entries, remove them from their menu, or drag to reorder. This showcase belongs to this page; dated upcoming events are managed under Events.'}),defineField({name:'coaches',title:'Coaches',type:'array',of:[{type:'coach'}],hidden:({parent})=>!Object.hasOwn(parent || {},'coaches') || Object.hasOwn(parent || {},'coachRefs'),description:'One entry per coach, in website order. Add a coach, open one to edit their details, or use its menu to remove it. Drag entries to reorder. This list belongs to this page.'}),defineField({name:'texts',title:'Text',type:'array',components:{input:TextListInput},of:[{type:'pageText'}],options:fixed,hidden:({value})=>!value?.length,description:'Edit the text below. Changes appear in these positions after publishing.'}),defineField({name:'images',title:'Photos',type:'array',of:[{type:'pageImage'}],options:fixed,hidden:({value})=>!value?.length,description:'Open a photo to replace it or edit its description.'})],preview:{select:{title:'label',texts:'texts',images:'images',coaches:'coaches',seminars:'seminars',coachRefs:'coachRefs',seminarRefs:'seminarRefs'},prepare({title,texts,images,coaches,seminars,coachRefs,seminarRefs}){return {title,subtitle:[coachRefs ? coachRefs.length+' selected coaches' : '',seminarRefs ? seminarRefs.length+' selected guests' : '',seminars ? seminars.length+' seminar guests' : '',coaches ? coaches.length+' coaches' : '',texts?.length ? texts.length+(texts.length===1?' text field':' text fields') : '',images?.length ? images.length+(images.length===1?' photo':' photos') : ''].filter(Boolean).join(' · '),media:seminars?.[0]?.photo || coaches?.[0]?.photo || images?.[0]?.image};}}}),
  defineType({name:'sitePage',title:'Website page',type:'document',groups:[{name:'content',title:'Page content',default:true},{name:'seo',title:'Search listing'}],fields:[
    defineField({name:'title',type:'string',title:'Page',readOnly:true}),
    defineField({name:'route',type:'string',title:'Website address',readOnly:true,components:{input:PageLinkInput},description:'Page addresses and layouts are managed in the website.'}),
    defineField({name:'sections',title:'Page sections',type:'array',group:'content',of:[{type:'pageSection'}],options:fixed,description:'Sections follow the website from top to bottom and use its visible headings. Open a section, then choose the named text or photo. The class timetable is managed separately.'}),
    defineField({name:'seoTitle',title:'Search title',type:'string',group:'seo',validation:rule=>rule.required().max(100).warning('Keep this concise for search results.')}),
    defineField({name:'seoDescription',title:'Search description',type:'text',rows:3,group:'seo',validation:rule=>rule.max(180).warning('A shorter description is usually easier to read in search results.')}),
  ],preview:{select:{title:'title',subtitle:'route'}}}),
  defineType({name:'event',title:'Event',type:'document',fields:[
    defineField({name:'title',title:'Event name',type:'string',validation:required}),
    defineField({name:'category',title:'Type of event',type:'string',options:{list:['Seminar','Team gathering','Competition','Grading','Open mat','Other']},initialValue:'Seminar',validation:required}),
    defineField({name:'summary',title:'Short description',type:'text',rows:4,validation:rule=>rule.required().max(600)}),
    defineField({name:'location',title:'Location',type:'string',validation:required}),
    defineField({name:'audience',title:'Who can attend',type:'string'}),
    defineField({name:'startsAt',title:'Starts',type:'datetime',description:'Check the displayed timezone when entering New Zealand dates.',validation:required}),
    defineField({name:'endsAt',title:'Ends',type:'datetime',description:'After this time the event moves into Past Events.',validation:rule=>rule.required().custom((value,context)=>!value || !context.document?.startsAt || Date.parse(value)>=Date.parse(context.document.startsAt) || 'End must be after the start.')}),
    defineField({name:'image',title:'Event photo',type:'image',fields:[defineField({name:'alt',title:'Photo description',type:'string',validation:required})],validation:required}),
    defineField({name:'url',title:'Booking or details link',type:'url',validation:rule=>rule.uri({scheme:['https','http'],allowRelative:true})}),
    defineField({name:'featured',title:'Feature at the top of the events page',type:'boolean',initialValue:false,description:'If several upcoming events are featured, the earliest is shown.'}),
  ],preview:{select:{title:'title',subtitle:'location',media:'image'}},orderings:[{title:'Start date',name:'startsAtAsc',by:[{field:'startsAt',direction:'asc'}]}]}),
];

const sharedGroups=[{name:'profile',title:'Profile',default:true},{name:'variations',title:'Page-specific details'}];
const copyFields = ['name','role','bio','description','photo','alt','belt','stripes','placeholder'];
const baseFields = [...schemaTypes.find(t=>t.name==='coach').fields,...schemaTypes.find(t=>t.name==='seminarGuest').fields].filter((f,i,a)=>a.findIndex(x=>x.name===f.name)===i);
schemaTypes.push(defineType({name:'profilePageCopy',title:'Existing page version',type:'object',fields:[
 defineField({name:'pageId',type:'string',hidden:true,readOnly:true}),defineField({name:'label',title:'Page',type:'string',readOnly:true}),
 ...copyFields.map(name=>{const original=baseFields.find(f=>f.name===name);return defineField({...original,name,type:original?.type||'string',title:original?.title||'Placeholder text',validation:undefined,initialValue:undefined,hidden:({parent})=>!Object.hasOwn(parent||{},name),description:'Optional page-specific value. Clear this field to use the main profile value.'});}),
],preview:{select:{title:'label'}}}));
for(const [name,source,title] of [['coachProfile','coach','Coach'],['seminarProfile','seminarGuest','Seminar guest']]){
 const fields=schemaTypes.find(t=>t.name===source).fields.map(f=>({...f,group:'profile',validation:f.name==='photo'?rule=>rule.required().warning('Add a portrait when available.'):f.validation}));
 schemaTypes.push(defineType({name,title,type:'document',groups:sharedGroups,fields:[
  defineField({name:'usage',title:'Used on',type:'string',readOnly:true,components:{input:UsageInput},group:'profile'}),
  defineField({name:'active',title:'Show on website',type:'boolean',initialValue:true,group:'profile',description:'Turn off to hide this profile from every page. The saved profile and page selections are kept.'}),
  ...fields,
  ...(name==='coachProfile'?[defineField({name:'academy',title:'Academy',type:'string',group:'profile',options:{list:[{title:'Queenstown',value:'queenstown'},{title:'Wānaka',value:'wanaka'},{title:'Invercargill',value:'invercargill'},{title:'South Canterbury',value:'south-canterbury'}]}}),defineField({name:'placeholder',title:'Missing portrait label',type:'string',group:'profile'})]:[]),
  defineField({name:'pageCopy',title:'Preserved page-specific details',type:'array',group:'variations',of:[{type:'profilePageCopy'}],options:{disableActions:['add','duplicate','copy','sort']},description:'These pages previously used different wording, photos or rank details. The main profile is the default. Edit a variation here, clear an individual override, or remove the variation to use the main profile everywhere on that page. Review differences before standardising.'}),
  defineField({name:'reviewNotes',type:'text',hidden:true}),
 ],preview:{select:{title:'name',role:name==='coachProfile'?'role':'description',media:'photo',active:'active'},prepare({title,role,media,active}){return {title,subtitle:[active===false?'Hidden':null,role].filter(Boolean).join(' · '),media}}},orderings:[{title:'Name',name:'nameAsc',by:[{field:'name',direction:'asc'}]}]}));
}
const eventType=schemaTypes.find(t=>t.name==='event');
eventType.fields.push(defineField({name:'guest',title:'Seminar guest (optional)',type:'reference',to:[{type:'seminarProfile'}],description:'Link this dated event to an existing guest profile. Keep this event’s own photo and booking details above.'}));

schemaTypes.push(defineType({name:'siteSettings',title:'Website details',type:'document',fields:[
 defineField({name:'title',title:'Settings',type:'string',readOnly:true}),
 defineField({name:'phone',title:'Main phone number',type:'string',description:'Updates the main Queenstown phone links throughout the supported website pages.',validation:rule=>rule.required().regex(/^\+?[\d ()-]{5,25}$/)}),
 ...[['facebook','Facebook'],['instagram','Instagram'],['bookingUrl','Book a free trial / join link']].map(([name,title])=>defineField({name,title,type:'url',validation:rule=>rule.required().uri({scheme:['https']})})),
],preview:{select:{title:'title'}}}));

const niceTitle=page=>page._id==='page-home'?'Home':page._id==='page-locations'?'All academies':page._id==='page-about-coaches'?'Coaches page':page.route.split('/').filter(Boolean).at(-1).split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ').replace('Wanaka','Wānaka').replace('Faq','Frequently asked questions');
function ownerStructure(S){
 const pageItem=p=>S.listItem().id(p._id).title(niceTitle(p)).child(S.document().schemaType('sitePage').documentId(p._id));
 const pageGroup=(title,pages)=>S.listItem().title(title).child(S.list().title(title).items([...pages].sort((a,b)=>a.route.split('/').length-b.route.split('/').length).map(pageItem)));
 const profileList=(title,type,filter)=>S.listItem().title(title).child(S.documentList().title(title).schemaType(type).filter(filter||'_type == $type').params({type}).defaultOrdering([{field:'name',direction:'asc'}]));
 const events=(title,filter)=>S.listItem().title(title).child(S.documentList().title(title).schemaType('event').filter('_type == "event" && '+filter).defaultOrdering([{field:'startsAt',direction:'asc'}]));
 return S.list().title('Manage your website').items([
  S.listItem().title('Start here — editing guide').child(S.component().id('owner-guide').title('Editing guide').component(OwnerGuide)),
  profileList('Coaches','coachProfile'),profileList('Seminar guests','seminarProfile'),
  S.documentTypeListItem('post').title('Blog posts'),
  S.listItem().title('Events').child(S.list().title('Events').items([events('Upcoming & current','endsAt >= now()'),events('Past events','endsAt < now()'),events('All events & drafts','true')])),
  pageGroup('Academies',manifest.filter(p=>p.route.startsWith('/locations/'))),
  S.listItem().title('Pages').child(S.list().title('Pages').items([
   pageItem(manifest.find(p=>p._id==='page-home')),
   ...[['Training','/training/'],['Membership & visiting','/membership/'],['About the academy','/about/'],['Seminars & stories','/seminars/']].map(([title,prefix])=>pageGroup(title,manifest.filter(p=>p.route.startsWith(prefix)))),
   pageGroup('Contact & questions',manifest.filter(p=>['/contact/','/faq/'].includes(p.route))),
   pageGroup('Legal',manifest.filter(p=>['/privacy/','/terms/'].includes(p.route))),
  ])),
  S.listItem().title('Website details').child(S.document().schemaType('siteSettings').documentId('site-settings')),
 ]);
}

export default defineConfig({
  name:'carlson-gracie',title:'Carlson Gracie NZ',
  projectId:process.env.SANITY_STUDIO_PROJECT_ID || sanityConfig.projectId || 'setup-required',
  dataset:process.env.SANITY_STUDIO_DATASET || sanityConfig.dataset,
  plugins:[structureTool({structure:ownerStructure})],
  schema:{types:schemaTypes,templates:templates=>templates.filter(t=>!['sitePage','siteSettings'].includes(t.schemaType))},
  document:{actions:(actions,context)=>['sitePage','siteSettings'].includes(context.schemaType) ? actions.filter(action=>!['delete','duplicate','unpublish'].includes(action.action)) : actions},
});
