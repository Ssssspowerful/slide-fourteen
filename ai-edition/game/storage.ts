import {env} from 'cloudflare:workers';
import {Fault} from './protocol.ts';
import {create,migrateState,transition,type State} from './engine.ts';
interface DB {prepare(sql:string):{bind(...args:unknown[]):{first<T>():Promise<T|null>,run():Promise<unknown>}}}
const db=()=>{const d=(env as unknown as {DB?:DB}).DB;if(!d)throw new Fault('STORAGE-UNAVAILABLE','Continuation storage is unavailable; retain your input and retry.');return d;};
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))));
const token=()=>`CR1.${hex(crypto.getRandomValues(new Uint8Array(32)))}`;
export function validToken(t:unknown):asserts t is string {if(typeof t!=='string'||!/^CR1\.[a-f0-9]{64}$/.test(t))throw new Fault('CONTINUATION','Invalid continuation.');}
const parseState=(body:string)=>migrateState(JSON.parse(body) as State);
export async function load(t:unknown):Promise<State>{validToken(t);const row=await db().prepare('SELECT body FROM analyst_snapshots WHERE key = ?').bind(await digest(t)).first<{body:string}>();if(!row)throw new Fault('CONTINUATION','Continuation not found or altered.');const state=parseState(row.body);state.language??='en';return state;}
export async function open(alias:unknown,language:unknown='en'){const t=token();const s=create(alias,'TERM-'+hex(crypto.getRandomValues(new Uint8Array(8))),language);await db().prepare('INSERT INTO analyst_snapshots (key,body,created_at) VALUES (?,?,?)').bind(await digest(t),JSON.stringify(s),Date.now()).run();return {continuation:t,state:s};}
export async function operate(t:unknown,command:unknown,request:unknown){validToken(t);if(typeof command!=='string'||command.length>16000)throw new Fault('LIMIT','Command limit: 16000 characters.');if(typeof request!=='string'||!/^[-A-Za-z0-9_.:]{1,96}$/.test(request))throw new Fault('REQUEST-ID','Use a 1–96 character requestId containing ASCII letters, digits, dash, underscore, dot or colon.');
 const parent=await digest(t),action=await digest(command),child='CR1.'+await digest('SF1\0'+t+'\0'+request+'\0'+action);
 const previous=await db().prepare('SELECT action_hash,body FROM analyst_snapshots WHERE parent=? AND request_id=?').bind(parent,request).first<{action_hash:string,body:string}>();
 if(previous){if(previous.action_hash!==action)throw new Fault('REQUEST-CONFLICT','This requestId already describes a different operation at this continuation.');return {continuation:child,state:parseState(previous.body)};}
 const base=await load(t);const state=command==='@CONTINUE'?{...base,stopped:false}:transition(base,command,request);
 const body=JSON.stringify(state);if(new TextEncoder().encode(body).length>1400000)throw new Fault('LIMIT','Continuation capacity reached; retain the previous record.');
 // Both concurrent identical requests derive the same capability. Conflicts cannot overwrite a snapshot.
 await db().prepare('INSERT OR IGNORE INTO analyst_snapshots (key,parent,request_id,action_hash,body,created_at) VALUES (?,?,?,?,?,?)').bind(await digest(child),parent,request,action,body,Date.now()).run();
 const row=await db().prepare('SELECT action_hash,body FROM analyst_snapshots WHERE parent=? AND request_id=?').bind(parent,request).first<{action_hash:string,body:string}>();
 if(!row||row.action_hash!==action)throw new Fault('REQUEST-CONFLICT','The requestId was used by a concurrent operation.');return {continuation:child,state:parseState(row.body)};
}
