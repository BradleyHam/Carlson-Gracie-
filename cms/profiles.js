/** Published records are expanded in the query; drafts never enter website rendering. */
export function resolvePageProfiles(page) {
 if(!page)return page;
 return {...page,sections:(page.sections||[]).map(section=>{
  const result={...section};
  for(const [references,profiles,output] of [['coachRefs','coachProfiles','coaches'],['seminarRefs','seminarProfiles','seminars']]){
   if(!Array.isArray(section[references]))continue;
   result[output]=(section[profiles]||[]).filter(profile=>profile&&profile.active!==false).map(profile=>{
    const variation=profile.pageCopy?.find(item=>item.pageId===page._id);
    const overrides=Object.fromEntries(Object.entries(variation||{}).filter(([key,value])=>!['_key','pageId','label'].includes(key)&&value!==''&&value!==null&&value!==undefined));
    return {...profile,...overrides,_key:profile._id};
   });
  }
  return result;
 })};
}
export const pageProjection = '{...,"settings":*[_id == "site-settings"][0],sections[]{...,"coachProfiles":coachRefs[]->,"seminarProfiles":seminarRefs[]->}}';
export const allPagesQuery = '*[_type == "sitePage"]'+pageProjection;
