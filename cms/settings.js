export const defaultSettings = {_id:'site-settings',_type:'siteSettings',title:'Website details',phone:'+64 21 0230 4516',facebook:'https://www.facebook.com/CarlsonGracieJiuJitsuNewZealand/',instagram:'https://www.instagram.com/carlsongracie_nz/',bookingUrl:'https://carlson-gracie-jiu-jitsu-new-zealand-queenstown.gymdesk.com/signup/v/6V5yQ'};
export function settingLinkKey(href='') {
 if(href==='tel:+642102304516')return 'phone';
 for(const key of ['facebook','instagram','bookingUrl'])if(href===defaultSettings[key])return key;
 return null;
}
export function settingHref(settings,key) {
 if(key==='phone')return /^\+?[\d ()-]{5,25}$/.test(settings?.phone||'')?'tel:'+settings.phone.replace(/[^\d+]/g,''):null;
 const value=settings?.[key];if(typeof value!=='string')return null;
 try {const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}
}
