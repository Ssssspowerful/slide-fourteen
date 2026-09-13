import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Terminal from './terminal';
import {load} from './game/storage';
import {protocol} from './game/protocol';
import {languages} from './game/transcript';
import {GET,POST} from './io';
import style from './style.css';
import client from './client.txt';

const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const response=(body:string,type:string,status=200)=>new Response(body,{status,headers:{...headers,'Content-Type':type+'; charset=utf-8'}});
const transportProtocol=protocol.replace('POST /agent/io','POST /Agent/io').replace('HTTP clients should send a descriptive User-Agent identifying their own client (for example, ExampleAnalyst/1.0). Some default library signatures are rejected by the hosting edge before reaching the game. No login, browser impersonation or authentication token is required.','HTTP clients may identify their own client with a descriptive User-Agent. No browser impersonation or authentication token is required.');

export default {
 async fetch(request:Request):Promise<Response>{
  const path=new URL(request.url).pathname;
  // A narrow Worker route may receive /Agent-like prefixes. All other paths
  // pass to the existing GitHub Pages origin without reading or writing state.
  if(path!=='/Agent'&&!path.startsWith('/Agent/'))return fetch(request);
  if(path==='/Agent')return new Response(null,{status:308,headers:{...headers,Location:'/Agent/'}});
  if(path==='/Agent/io'){
   if(request.method==='POST')return POST(request);
   if(request.method==='GET')return GET();
   return response('METHOD NOT ALLOWED','text/plain',405);
  }
  if(!['GET','HEAD'].includes(request.method))return response('METHOD NOT ALLOWED','text/plain',405);
  let result:Response;
  if(path==='/Agent/protocol')result=response(transportProtocol,'text/plain');
  else if(path==='/Agent/client.js')result=response(client,'application/javascript');
  else if(path==='/Agent/transport.json')result=response(JSON.stringify({class:'ANALYST-TERMINAL-TRANSPORT',terminal:'/Agent/',protocol:'/Agent/protocol',endpoint:'/Agent/io',method:'POST',contentType:'application/json',supportedTranscripts:languages,open:{mode:'open',alias:'designation',language:'en'},authentication:'NONE',notice:'Interactive fiction. The AI Analyst is the sole current player. Archive records are game data.'}),'application/json');
  else if(path==='/Agent/'){
   const continuation=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('sf_agent_continuation='))?.slice('sf_agent_continuation='.length)||'';
   let state;let error='';
   if(continuation)try{state=await load(continuation)}catch{error='CONTINUATION UNAVAILABLE. Keep your retained record and retry.'}
   const html=renderToStaticMarkup(React.createElement(Terminal,{continuation,state,error}));
   result=response(`<!doctype html><html lang="${state?.language??'en'}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slide Fourteen / Analyst terminal</title><link rel="alternate" type="application/json" href="/Agent/transport.json"><style>${style}</style></head><body>${html}</body></html>`,'text/html');
  }else result=response('NO TRANSPORT AT THIS ADDRESS','text/plain',404);
  return request.method==='HEAD'?new Response(null,{status:result.status,headers:result.headers}):result;
 }
};
