import {defineConfig, defineType, defineField} from 'sanity';
import {structureTool} from 'sanity/structure';
import {sanityConfig} from '../cms/config.js';
import manifest from '../cms/manifest.json';

const fixed = {disableActions:['add','remove','duplicate','copy','sort']};
const label = defineField({name:'label',type:'string',readOnly:true,hidden:true});
const required = rule => rule.required();
const schemaTypes = [
  defineType({name:'pageText',title:'Copy',type:'object',fields:[label,defineField({name:'value',title:'Text',type:'text',rows:3,validation:required})],preview:{select:{title:'label',subtitle:'value'}}}),
  defineType({name:'pageImage',title:'Photo',type:'object',fields:[label,defineField({name:'image',title:'Replacement photo',type:'image',description:'Upload a replacement. Leave empty to keep the existing site photo.'}),defineField({name:'alt',title:'Photo description',type:'string',description:'Describe the photo for visitors who cannot see it.'}),defineField({name:'originalSrc',type:'string',hidden:true,readOnly:true})],preview:{select:{title:'label',media:'image'}}}),
  defineType({name:'pageSection',title:'Page section',type:'object',fields:[label,defineField({name:'texts',title:'Copy',type:'array',of:[{type:'pageText'}],options:fixed}),defineField({name:'images',title:'Photos',type:'array',of:[{type:'pageImage'}],options:fixed})],preview:{select:{title:'label'}}}),
  defineType({name:'sitePage',title:'Website page',type:'document',groups:[{name:'content',title:'Page content',default:true},{name:'seo',title:'Search listing'}],fields:[
    defineField({name:'title',type:'string',title:'Page',readOnly:true}),
    defineField({name:'route',type:'string',title:'Website address',readOnly:true,description:'Page addresses and layouts are managed in the website.'}),
    defineField({name:'sections',title:'Page sections',type:'array',group:'content',of:[{type:'pageSection'}],options:fixed,description:'Open a section to edit its copy and photos. Class timetables are managed separately and are deliberately excluded.'}),
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
