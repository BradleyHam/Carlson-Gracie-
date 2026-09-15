import {defineConfig, defineType, defineField} from 'sanity';
import {structureTool} from 'sanity/structure';
import {sanityConfig} from '../cms/config.js';
import manifest from '../cms/manifest.json';

const fixed = {disableActions:['add','remove','duplicate','copy','sort']};
const label = defineField({name:'label',title:'On the website',type:'string',readOnly:true,description:'The part of this page that this content belongs to.'});
const required = rule => rule.required();
const schemaTypes = [
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
  defineType({name:'pageSection',title:'Page section',type:'object',fields:[label,defineField({name:'seminars',title:'Seminar guests',type:'array',of:[{type:'seminarGuest'}],hidden:({parent})=>!Object.hasOwn(parent || {},'seminars'),description:'Each entry keeps the guest name, photo and description together. Add entries, remove them from their menu, or drag to reorder. This showcase belongs to this page; dated upcoming events are managed under Events.'}),defineField({name:'coaches',title:'Coaches',type:'array',of:[{type:'coach'}],hidden:({parent})=>!Object.hasOwn(parent || {},'coaches'),description:'One entry per coach, in website order. Add a coach, open one to edit their details, or use its menu to remove it. Drag entries to reorder. This list belongs to this page.'}),defineField({name:'texts',title:'Text on the website',type:'array',of:[{type:'pageText'}],options:fixed,hidden:({value})=>!value?.length,description:'Names match the cards and headings on the page. The second line shows the current text.'}),defineField({name:'images',title:'Photos on the website',type:'array',of:[{type:'pageImage'}],options:fixed,hidden:({value})=>!value?.length,description:'Match the name to the text above, for example Kids description and Kids photo.'})],preview:{select:{title:'label',texts:'texts',images:'images',coaches:'coaches',seminars:'seminars'},prepare({title,texts,images,coaches,seminars}){return {title,subtitle:[seminars ? seminars.length+' seminar guests' : '',coaches ? coaches.length+' coaches' : '',texts?.length ? texts.length+(texts.length===1?' text field':' text fields') : '',images?.length ? images.length+(images.length===1?' photo':' photos') : ''].filter(Boolean).join(' · '),media:seminars?.[0]?.photo || coaches?.[0]?.photo || images?.[0]?.image};}}}),
  defineType({name:'sitePage',title:'Website page',type:'document',groups:[{name:'content',title:'Page content',default:true},{name:'seo',title:'Search listing'}],fields:[
    defineField({name:'title',type:'string',title:'Page',readOnly:true}),
    defineField({name:'route',type:'string',title:'Website address',readOnly:true,description:'Page addresses and layouts are managed in the website.'}),
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

export default defineConfig({
  name:'carlson-gracie',title:'Carlson Gracie NZ',
  projectId:process.env.SANITY_STUDIO_PROJECT_ID || sanityConfig.projectId || 'setup-required',
  dataset:process.env.SANITY_STUDIO_DATASET || sanityConfig.dataset,
  plugins:[structureTool({structure:S=>S.list().title('Website content').items([
    S.listItem().title('Pages').child(S.list().title('Pages').items(manifest.map(page=>S.listItem().id(page._id).title(page.title).child(S.document().schemaType('sitePage').documentId(page._id))))),
    S.documentTypeListItem('event').title('Events'),
  ])})],
  schema:{types:schemaTypes,templates:templates=>templates.filter(t=>t.schemaType!=='sitePage')},
  document:{actions:(actions,context)=>context.schemaType==='sitePage' ? actions.filter(action=>!['delete','duplicate','unpublish'].includes(action.action)) : actions},
});
