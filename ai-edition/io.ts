import {env} from 'cloudflare:workers';
import {assertFormOrigin,publicOrigin} from './http-origin';
import {open,load,operate} from './game/storage';
import {operations,serialize,phase,complete} from './game/engine';
import {languages} from './game/transcript';
import {Fault} from './game/protocol';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 const isJson=request.headers.get('content-type')?.includes('application/json');let continuation='';let command='';let requestId='';let mode='';let alias='';let transcript='en';
 try{
  const raw=await request.text();if(new TextEncoder().encode(raw).length>24000)throw new Fault('LIMIT','Request exceeds 24000 bytes.');
  const b:Record<string,unknown>=isJson?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));
  if(!b||typeof b!=='object'||Array.isArray(b))throw new Fault('SYNTAX','Expected a request object.');
  transcript=typeof b.language==='string'?b.language:'en';
  mode=typeof b.mode==='string'?b.mode:'';alias=typeof b.alias==='string'?b.alias:'';
  continuation=typeof b.continuation==='string'?b.continuation.trim():'';command=typeof b.command==='string'?b.command:'';requestId=typeof b.requestId==='string'?b.requestId:'';
  const configuredOrigin=(env as unknown as {ANALYST_PUBLIC_ORIGIN?:string}).ANALYST_PUBLIC_ORIGIN;
  const terminalOrigin=isJson?publicOrigin(request,configuredOrigin):assertFormOrigin(request,configuredOrigin);
  let result;
  if(b.mode==='open')result=await open(b.alias,b.language);
  else if(b.mode==='resume'){
   const state=await load(continuation);
   result=state.stopped?await operate(continuation,'@CONTINUE',requestId||crypto.randomUUID()):{continuation,state};
  }else result=await operate(continuation,command,requestId);
  if(isJson)return new Response(JSON.stringify({continuation:result.continuation,revision:result.state.rev,record:serialize(result.state),operations:operations(result.state),language:result.state.language??'en',state:phase(result.state),complete:complete(result.state),stopped:result.state.stopped}),{headers});
  const cookie=`sf_agent_continuation=${result.continuation}; HttpOnly; SameSite=Lax; Path=/Agent/; Max-Age=31536000${terminalOrigin.startsWith('https://')?'; Secure':''}`;
  return new Response(null,{status:303,headers:{Location:'/Agent/','Set-Cookie':cookie,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin'}});
 }catch(error){
  const known=error instanceof Fault;const syntax=error instanceof SyntaxError;const code=known?error.code:syntax?'SYNTAX':'STORAGE-UNAVAILABLE';const message=known?error.message:syntax?'Request body is not valid JSON.':'The operation could not be completed. Retain the continuation and request; retry with the same input.';
  if(!known&&!syntax)console.error('Analyst operation failed',error instanceof Error?error.message:'unknown');
  const status=code==='STORAGE-UNAVAILABLE'?503:code==='REQUEST-CONFLICT'?409:400;
  if(isJson)return new Response(JSON.stringify({error:{code,message},continuation:continuation||null,requestId:requestId||null}),{status,headers});
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  return new Response(`<!doctype html><html lang="en"><head><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terminal / Operation retained</title></head><body style="background:#0c1110;color:#c5d0be;font:16px/1.6 monospace;padding:2em"><h1 style="font:inherit">${escape(code)}</h1><p>${escape(message)}</p><form method="post" action="/Agent/io">${mode?`<input type="hidden" name="mode" value="${escape(mode)}">`:""}${mode==="open"?`<label>DESIGNATION<input name="alias" value="${escape(alias)}"></label>`:""}<input type="hidden" name="language" value="${escape(transcript)}"><input type="hidden" name="continuation" value="${escape(continuation)}"><input type="hidden" name="requestId" value="${escape(requestId)}">${mode==="open"||mode==="resume"?"":`<label>COMMAND<br><textarea name="command" rows="8" cols="70">${escape(command)}</textarea></label>`}<p>Preserved input. A rejected operation has not changed the continuation.</p><button>SUBMIT</button></form><a href="/Agent/">RETURN TO TERMINAL</a></body></html>`,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
 }
}
export function GET(){return new Response(JSON.stringify({protocol:'/Agent/protocol',method:'POST',operations:['open','resume','command'],supportedTranscripts:languages,open:{mode:'open',alias:'designation',language:'en'},interfaceNotes:'/Agent/protocol'}),{headers});}
