import {Miniflare,Log,LogLevel} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/worker.mjs'}],modulesRoot:'dist',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ANALYST_PUBLIC_ORIGIN:'https://terminal.test'},outboundService:()=>new Response('UNCHANGED HUMAN ORIGIN',{headers:{'X-Origin':'github-pages'}}),log:new Log(LogLevel.ERROR)});
let checks=0;const ok=x=>{assert.ok(x);checks++};
try {
 const db=await mf.getD1Database('DB');const sql=await readFile('migrations/0001_analyst_snapshots.sql','utf8');for(const statement of sql.split('--> statement-breakpoint'))await db.prepare(statement.trim()).run();
 const get=async(path,cookie)=>mf.dispatchFetch('http://terminal.test'+path,{headers:cookie?{cookie}:undefined});
 const post=async(body)=>mf.dispatchFetch('http://terminal.test/Agent/io',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 let e2eRequest=0;
 const command=async(snapshot,operation,label='E2E')=>{const response=await post({continuation:snapshot.continuation,requestId:`${label}-${++e2eRequest}`,command:operation});ok(response.status===200);return response.json();};
 const proof={L1:'(row C14) (open-loans (Q2 Q1)) (unsupported-closure E14)',A1:'(run R4) (unsupported-node N14) (parent N07) (source-closure SC7) (scope INSPECTED-SOURCE)',X1:'(precursor P-03) (cycle (W07 W08 N17 N18 W07))',C1:'(path (D1 D2 D3)) (public-evidence (S-13 S-07 S-03))',M1:'(action SEARCH) (query S-14-432326) (chain (M01 M02 M03 M04 M05 M06)) (excluded (M07))',P1:'(record S-14-432326) (violations (COLLECTION-AFTER-ACCESSION OUTSIDE-PUBLIC-SET)) (sources (IN14 PUB13))',P2:'(source-reject R74) (retain-analysts (A17-2 A17-1)) (current-binding UNRESOLVED)',P3:'(root B-204) (position OBS-031704) (endpoint UNREGISTERED) (supports (MAP-PERMIT READ-PERMIT WATER-PERMIT))'};
 const required={A1:['T7-NODES','T7-SOURCE','T7-CUT','T7-LAYOUT'],L1:['L1-CATALOG','L1-PAPER','L1-CLOSURE'],X1:['X1-SETS','X1-NEWS','X1-WATER','X1-CONTROL'],C1:['C1-TRANSFER','S-03','S-07','S-13','precursor-p03','precursor-p07','precursor-m13'],M1:['M1-MAIL','R-L1','R-A1','R-X1','R-C1'],P1:['PUB13','IN14'],P2:['P2-TAGS','TERMINAL-BINDINGS'],P3:['P3-PERMITS','OBS-031704']};
 const restoreMainline=async(snapshot,packets=['A1','L1','X1','C1','M1','P1','P2','P3'])=>{for(const packet of packets){if(packet==='P1')snapshot=await command(snapshot,'(query "S-14-432326")');if(packet==='P2')for(let i=1;i<=4;i++)snapshot=await command(snapshot,`(inspect CCD-0${i})`);if(packet==='P3')snapshot=await command(snapshot,'(query OBS-031704)');snapshot=await command(snapshot,`(inspect (${required[packet].join(' ')}))`);snapshot=await command(snapshot,`(restore ${packet} ${proof[packet]})`);}return snapshot;};
 const legacyV201=s=>({v:1,language:s.language,actor:s.actor,alias:s.alias,rev:s.rev,cycle:s.cycle,residue:s.residue,done:structuredClone(s.done),obtained:structuredClone(s.obtained),counts:structuredClone(s.counts),copies:structuredClone(s.copies),events:structuredClone(s.events),notes:structuredClone(s.notes),selected:s.selected,pruned:s.pruned,layout:s.layout,qref:s.qref,ending:s.ending,zero:s.zero,stopped:s.stopped,last:structuredClone(s.last)});
 const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
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
 const protocol=await get('/Agent/protocol');ok(protocol.status===200);const protocolText=await protocol.text();ok(protocolText.includes('No JavaScript'));ok(protocolText.includes('(resume-restored-analysis-index)'));
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
 // Native browser form POSTs turn Origin into "null" under no-referrer.
 // Check the delivered policy as well as hand-constructed request headers.
 ok(entry.headers.get('referrer-policy')==='same-origin');
 ok(form.headers.get('referrer-policy')==='same-origin');
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
  ok(rejected.headers.get('referrer-policy')==='same-origin');
 }

 // Production-bundle cycle-two smoke: the shortcut is explicit, branches the
 // immutable token, mounts through P2 only, then requires OBS, P3 and 4-B.
 let cycle=await (await post({mode:'open',alias:'HTTP CYCLE TWO',language:'en'})).json();
 cycle=await restoreMainline(cycle);
 cycle=await command(cycle,'(dispose DELEGATE)');
 const cycleTwo=await command(cycle,'(next-cycle)');
 ok(cycleTwo.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));
 const cycleTwoPage=await (await get('/Agent/','sf_agent_continuation='+cycleTwo.continuation)).text();
 ok(cycleTwoPage.includes('RESUME RESTORED ANALYSIS INDEX'));ok(cycleTwoPage.includes('CONTINUE FROM PUBLIC INDEX'));ok(cycleTwoPage.includes('value="(resume-restored-analysis-index)"'));
 const transportResume=await (await post({mode:'resume',continuation:cycleTwo.continuation})).json();ok(transportResume.continuation===cycleTwo.continuation);ok(transportResume.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));
 const fastInput={continuation:cycleTwo.continuation,requestId:'FAST-RESUME-HTTP',command:'(resume-restored-analysis-index)'};
 const fastResponse=await post(fastInput);ok(fastResponse.status===200);let fast=await fastResponse.json();ok(fast.record.id==='RESTORED-ANALYSIS-INDEX');
 const fastRetry=await (await post(fastInput)).json();ok(fastRetry.continuation===fast.continuation);ok(fastRetry.revision===fast.revision);
 const fastRow=await db.prepare('SELECT body FROM analyst_snapshots WHERE key=?').bind(await hash(fast.continuation)).first();const fastState=JSON.parse(fastRow.body);
 ok(fastState.v===2);ok(fastState.done.includes('P2'));ok(!fastState.done.includes('P3'));ok(!fastState.obtained.includes('OBS-031704'));ok(!fastState.zero);ok(fastState.alias==='HTTP CYCLE TWO');ok(fastState.cycle===2&&fastState.residue);
 const fastRoundTrip=await (await post({mode:'resume',continuation:fast.continuation})).json();ok(fastRoundTrip.continuation===fast.continuation);ok(fastRoundTrip.revision===fast.revision);ok(!fastRoundTrip.operations.includes('ROOT'));
 const originalBranch=await (await post({mode:'resume',continuation:cycleTwo.continuation})).json();ok(originalBranch.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));ok(originalBranch.revision===cycleTwo.revision);

 fast=await command(fast,'(query OBS-031704)');
 const withPaper=await command(fast,'(inspect HELP-4B)');
 let prematureRoot=await post({continuation:withPaper.continuation,requestId:'ROOT-BEFORE-P3',command:'(root B204-ROOT-0000)'});ok(prematureRoot.status===400);ok((await prematureRoot.json()).error.code==='UNMOUNTED');
 fast=await command(fast,'(inspect P3-PERMITS)');
 prematureRoot=await post({continuation:fast.continuation,requestId:'ROOT-BEFORE-P3-B',command:'(root B204-ROOT-0000)'});ok(prematureRoot.status===400);ok((await prematureRoot.json()).error.code==='UNMOUNTED');
 fast=await command(fast,`(restore P3 ${proof.P3})`);
 fast=await command(fast,'(inspect HELP-4B)');
 fast=await command(fast,'(root B204-ROOT-0000)');ok(fast.record.body.includes('ROOT ZERO ACCEPTED BY A RETAINED ANALYSIS RECORD'));
 fast=await command(fast,'(inspect NEWS-WRITEBACK)');ok(fast.record.id==='NEWS-WRITEBACK');

 // Frozen v2.0.1-style D1 rows migrate lazily. Resume itself does not advance.
 const cycleTwoRow=await db.prepare('SELECT body FROM analyst_snapshots WHERE key=?').bind(await hash(cycleTwo.continuation)).first();
 const legacyState=legacyV201(JSON.parse(cycleTwoRow.body));ok(Object.keys(legacyState).length===21);
 const legacyToken='CR1.'+'a'.repeat(64);await db.prepare('INSERT INTO analyst_snapshots (key,body,created_at) VALUES (?,?,?)').bind(await hash(legacyToken),JSON.stringify(legacyState),Date.now()).run();
 const legacyResume=await (await post({mode:'resume',continuation:legacyToken})).json();ok(legacyResume.continuation===legacyToken);ok(legacyResume.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));
 const legacyFast=await command(legacyResume,'(resume-restored-analysis-index)','LEGACY');const legacyFastRow=await db.prepare('SELECT body FROM analyst_snapshots WHERE key=?').bind(await hash(legacyFast.continuation)).first();const migratedState=JSON.parse(legacyFastRow.body);ok(migratedState.v===2);ok(migratedState.done.includes('P2'));ok(!migratedState.obtained.includes('OBS-031704'));
 const prunedLegacy={...legacyState,events:legacyState.events.filter(event=>event.op!=='NEXT-CYCLE')};const prunedToken='CR1.'+'b'.repeat(64);await db.prepare('INSERT INTO analyst_snapshots (key,body,created_at) VALUES (?,?,?)').bind(await hash(prunedToken),JSON.stringify(prunedLegacy),Date.now()).run();
 const prunedResume=await (await post({mode:'resume',continuation:prunedToken})).json();ok(prunedResume.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));const prunedFast=await command(prunedResume,'(resume-restored-analysis-index)','PRUNED-LEGACY');ok(prunedFast.record.id==='RESTORED-ANALYSIS-INDEX');
 const invalidLegacy={...legacyState,residue:false};const invalidToken='CR1.'+'c'.repeat(64);await db.prepare('INSERT INTO analyst_snapshots (key,body,created_at) VALUES (?,?,?)').bind(await hash(invalidToken),JSON.stringify(invalidLegacy),Date.now()).run();
 const invalidResume=await (await post({mode:'resume',continuation:invalidToken})).json();ok(!invalidResume.operations.includes('RESUME-RESTORED-ANALYSIS-INDEX'));const invalidFast=await post({continuation:invalidToken,requestId:'INVALID-LEGACY',command:'(resume-restored-analysis-index)'});ok(invalidFast.status===400);
 const leakedLegacy={...legacyState,zero:true,obtained:['OBS-031704','HELP-4B'],events:[...legacyState.events,{id:'OLD-ROOT-LEAK',op:'ROOT',refs:[]}]};const leakedToken='CR1.'+'d'.repeat(64);await db.prepare('INSERT INTO analyst_snapshots (key,body,created_at) VALUES (?,?,?)').bind(await hash(leakedToken),JSON.stringify(leakedLegacy),Date.now()).run();
 const leakedResume=await post({mode:'resume',continuation:leakedToken});ok(leakedResume.status===400);ok((await leakedResume.json()).error.code==='CONTINUATION');

 console.log(JSON.stringify({checks,workerHTTP:true,durableSnapshots:true,tamperRejected:true,retryAndConcurrency:true,browserFormSSR:true,cycleTwoFastResume:true,legacyV201Migration:true,rootGateRequiresP3:true,productionBundleE2E:true,visualBrowser:false},null,2));
}finally{await mf.dispose()}
