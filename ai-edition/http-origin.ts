import {Fault} from './game/protocol.ts';

// Deployment configuration is trusted; forwarding headers and form fields are
// not. A proxy's internal request URL need not have the public site's origin.
export function publicOrigin(request:Request, configured?:unknown):string {
 if(configured===undefined||configured===null||configured==='')return new URL(request.url).origin;
 if(typeof configured!=='string')throw new Fault('STORAGE-UNAVAILABLE','Terminal origin configuration is unavailable.');
 try{
  const url=new URL(configured);
  if(!['http:','https:'].includes(url.protocol)||url.origin!==configured)throw new Error('Use an exact origin.');
  return url.origin;
 }catch{throw new Fault('STORAGE-UNAVAILABLE','Terminal origin configuration is invalid.');}
}

export function assertFormOrigin(request:Request, configured?:unknown):string {
 const expected=publicOrigin(request,configured);
 const supplied=request.headers.get('origin');
 if(supplied!==null&&supplied!==expected)throw new Fault('ORIGIN','Form origin does not match this terminal.');
 return expected;
}
