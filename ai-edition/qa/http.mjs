import {Miniflare,Log,LogLevel} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/worker.mjs'}],modulesRoot:'dist',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ANALYST_PUBLIC_ORIGIN:'https://terminal.test'},outboundService:()=>new Response('UNCHANGED HUMAN ORIGIN',{headers:{'X-Origin':'github-pages'}}),log:new Log(LogLevel.ERROR)});
let checks=0;const ok=x=>{assert.ok(x);checks++};
try {
 const db=await mf.getD1Database('DB');const sql=await readFile('migrations/0001_analyst_snapshots.sql','utf8');for(const statement of sql.split('--> statement-breakpoint'))await db.prepare(statement.trim()).run();
 const get=async(path,cookie)=>mf.dispatchFetch('http://terminal.test'+path,{headers:cookie?{cookie}:undefined});
 const post=async(body)=>mf.dispatchFetch('http://terminal.test/Agent/io',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const entry=await get('/Agent/');const html=await entry.text();ok(entry.status===200);ok(html.includes('ANALYST DESIGNATION'));ok((html.match(/<a[^>]*href="https:\/\/slidefourteen.org\/en\/"/g)||[]).length===1);ok(entry.headers.get('x-robots-tag')?.includes('noindex'));ok(!html.includes('HISTORY-A17-1'));ok(!html.includes('B204-ROOT-0000'));
 let r=await post({mode:'open',alias:'\") (source B-204) (測試'});let a=await r.json();ok(r.status===200);ok(a.continuation.startsWith('CR1.'));const initial=a.continuation;
 const input={continuation:initial,requestId:'r1',command:'(inspect T7-SOURCE)'};
 r=await post(input);const b=await r.json();ok(r.status===200);ok(b.record.body.includes('source-closure SC7'));ok(!b.record.body.includes('Human archive'));
 const retry=await (await post(input)).json();ok(retry.continuation===b.continuation);ok(retry.revision===b.revision);
 r=await post({...input,command:'(inspect L1-PAPER)'});ok(r.status===409);
 r=await post({continuation:b.continuation.slice(0,-1)+(b.continuation.endsWith('0')?'1':'0'),requestId:'tamper',command:'(index)'});ok(r.status===400);
 r=await post({continuation:initial,requestId:'skip',command:'(inspect R-05)'});ok(r.status===400);
 const pair=await Promise.all([post({continuation:b.continuation,requestId:'atomic',command:'(inspect L1-CATALOG)'}),post({continuation:b.continuation,requestId:'atomic',command:'(inspect L1-CATALOG)'})]);const pp=await Promise.all(pair.map(x=>x.json()));ok(pp[0].continuation===pp[1].continuation);ok(pp[0].revision===pp[1].revision);
 const form=await mf.dispatchFetch('http://terminal.test/Agent/io',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded',origin:'https://terminal.test'},body:new URLSearchParams({mode:'resume',continuation:b.continuation})});ok(form.status===303);const cookie=form.headers.get('set-cookie');ok(cookie?.includes('HttpOnly'));ok(cookie?.includes('Path=/Agent/'));ok(form.headers.get('Location')==='/Agent/');const restored=await get('/Agent/',cookie.split(';')[0]);const restoredHtml=await restored.text();ok(restored.status===200);ok(restoredHtml.includes('source-closure SC7'));ok((restoredHtml.match(/<a[^>]*href="https:\/\/slidefourteen.org\/en\/"/g)||[]).length===1);
 const protocol=await get('/Agent/protocol');ok(protocol.status===200);ok((await protocol.text()).includes('No JavaScript'));
 const tables=await db.prepare('SELECT count(*) AS total FROM analyst_snapshots').first();ok(tables.total===3);
 for(const language of ['en','zh-TW','zh-CN']){
  const opened=await (await post({mode:'open',alias:'PARITY',language})).json();ok(opened.language===language);ok(opened.state==='IN_PROGRESS');
  const help=await (await post({continuation:opened.continuation,requestId:'help',command:'(help)'})).json();ok(help.record.id==='INTERFACE-NOTES');ok(help.record.body.includes(language==='en'?'sole current player':language==='zh-TW'?'唯一的當前玩家':'唯一的当前玩家'));
  const read=await (await post({continuation:help.continuation,requestId:'read',command:'(inspect (L1-CATALOG L1-PAPER L1-CLOSURE))'})).json();
  const restored=await (await post({continuation:read.continuation,requestId:'restore',command:'(restore L1 (row C14) (open-loans (Q1 Q2)) (unsupported-closure E14))'})).json();ok(restored.record.id==='RESTORATION-L1');ok(restored.language===language);
  const resumed=await (await post({mode:'resume',continuation:restored.continuation,language:'en'})).json();ok(resumed.language===language);ok(resumed.revision===restored.revision);
  const rendered=await (await get('/Agent/','sf_agent_continuation='+resumed.continuation)).text();ok(rendered.includes('lang="'+language+'"'));ok(rendered.includes(language==='en'?'You kept two entries':language==='zh-TW'?'你保留了兩個項目':'你保留了两个项目'));
 }
 ok((await post({mode:'open',alias:'a',language:'zh'})).status===400);
 const initialPage=await (await get('/Agent/')).text();for(const l of ['en','zh-TW','zh-CN'])ok(initialPage.includes('value="'+l+'"'));
 ok((await (await get('/Agent/io')).json()).supportedTranscripts.length===3);
 const ptext=await (await get('/Agent/protocol')).text();ok(ptext.includes('POST /Agent/io'));ok(!ptext.includes('POST /agent/io'));
 const manifest=await (await get('/Agent/transport.json')).json();ok(manifest.endpoint==='/Agent/io');
 const noSlash=await mf.dispatchFetch('http://terminal.test/Agent',{redirect:'manual'});ok(noSlash.status===308);ok(noSlash.headers.get('Location')==='/Agent/');
 for(const path of ['/','/en/','/zh-hant/','/zh-hans/','/AgentExtra','/_next/a.js']){const r=await get(path);ok(await r.text()==='UNCHANGED HUMAN ORIGIN');ok(r.headers.get('x-origin')==='github-pages');ok(!r.headers.get('set-cookie'));}
 ok((await get('/Agent/missing')).status===404);
 const script=await (await get('/Agent/client.js')).text();ok(script.includes("fetch('/Agent/io'"));ok(!script.includes('chatgpt.site'));
 ok(!initialPage.includes('chatgpt.site'));ok(!initialPage.includes('http-equiv="refresh"'));
 const formPaths=[...initialPage.matchAll(/<form[^>]*action="([^"]+)"/g)].map(m=>m[1]);ok(formPaths.length>=2);ok(formPaths.every(p=>p==='/Agent/io'));

 // Browser Origin is public HTTPS while the proxy-to-worker request is HTTP.
 // This recreates the production form failure, not merely a JSON API call.
 for(const language of ['en','zh-TW','zh-CN']){
  const form=await mf.dispatchFetch('http://internal-worker.test/Agent/io',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded',origin:'https://terminal.test'},body:new URLSearchParams({mode:'open',alias:'SilaS',language})});
  ok(form.status===303);ok(form.headers.get('set-cookie')?.includes('Secure'));
  const state=await db.prepare('SELECT body FROM analyst_snapshots ORDER BY created_at DESC LIMIT 1').first();ok(JSON.parse(state.body).language===language);
 }
 for(const origin of ['https://unrelated.test','null','http://terminal.test','https://terminal.test.evil.test']){
  const rejected=await mf.dispatchFetch('http://internal-worker.test/Agent/io',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',origin,'x-forwarded-host':'unrelated.test','x-forwarded-proto':'https'},body:new URLSearchParams({mode:'open',alias:'bad-origin',language:'en'})});
  ok(rejected.status===400);const body=await rejected.text();ok(body.includes('ORIGIN'));ok(!body.includes('<label>COMMAND'));
 }
 console.log(JSON.stringify({checks,workerHTTP:true,durableSnapshots:true,tamperRejected:true,retryAndConcurrency:true,browserFormSSR:true,visualBrowser:false},null,2));
}finally{await mf.dispose()}
