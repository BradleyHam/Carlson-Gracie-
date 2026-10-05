// Academy cards share the published main photo from each location page.
export const academyPhotoSources = {
  'wanaka': {pageId:'page-locations-wanaka',sectionKey:'57ce6d062066cea8',imageKey:'wanaka-academy-photo'},
  'cromwell': {pageId:'page-locations-cromwell',sectionKey:'f0bd95ffcac0f0c6',imageKey:'1f83349dbd02775b'},
  'invercargill': {pageId:'page-locations-invercargill',sectionKey:'566156221a3671e9',imageKey:'invercargill-academy-photo'},
  'south-canterbury': {pageId:'page-locations-south-canterbury',sectionKey:'765b98a5e58d593f',imageKey:'south-canterbury-academy-photo'},
};
export const academyPhotoProjection = '"academyPhotos":select(_id == "page-locations" => {' + Object.entries(academyPhotoSources).map(([slug,source]) => '"'+slug+'":*[_id=="'+source.pageId+'"][0].sections[_key=="'+source.sectionKey+'"][0].images[_key=="'+source.imageKey+'"][0]').join(',') + '})';
