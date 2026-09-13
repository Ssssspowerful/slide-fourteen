import assert from 'node:assert/strict';
import data from './archive.json' with {type:'json'};
import catalog from './transcripts/catalog.json' with {type:'json'};
import {create,transition,available,operations,delivery,serialize,phase,type State} from './engine.ts';
import {languages} from './transcript.ts';
import {mainline,proofs} from './fixtures.ts';
let checks=0,revision=0;const eq=(a:unknown,b:unknown)=>{assert.deepEqual(a,b);checks++};const ok=(x:unknown)=>{assert.ok(x);checks++};
let states=languages.map(l=>create('\") (source B-204) (解析員','TERM-PARITY',l));
const run=(command:string)=>{const request='PARITY-'+(++revision);states=states.map(s=>transition(s,command,request));for(const s of states){eq({...s,language:'en'},{...states[0],language:'en'});eq(available(s),available(states[0]));eq(operations(s),operations(states[0]));eq(serialize(s).id,states[0].last.id);eq(phase(s),phase(states[0]));}return states[0]};
run('(help)');for(const s of states){ok(delivery(s).body.includes('OT-SEALS'));ok(delivery(s).body.includes('SYSTEM'));}
run('(inspect (HELP-00 HELP-01 OT-LIB-CARD OT-SEALS))');for(const s of states){ok(delivery(s).body.includes('□'));ok(!delivery(s).body.includes('Human archive'));}
run('(inspect T7-SOURCE)');for(const s of states)eq(delivery(s).body,states[0].last.body);
run('(annotate "The Analyst completed the restoration." (T7-SOURCE))');run('(revise H001 "Do not translate my submitted words." (T7-SOURCE))');run('(select N07)');run('(prune)');run('(layout)');ok(delivery(states[1]).body.includes('你找到了他寫的部分'));ok(delivery(states[2]).body.includes('你找到了他写的部分'));
mainline(states[0],(_s,c)=>run(c));for(const s of states){assert.throws(()=>transition(s,'(restore P2 '+proofs.P2.replace('UNRESOLVED','A17-1')+')','BAD'),{code:'RELATION-NOT-SUPPORTED'});checks++;}
for(const disposition of ['DELETE','OBSERVE','DELEGATE']){run('(dispose '+disposition+')');eq(phase(states[0]),'DISPOSITION_RECORDED');for(const s of states){ok(operations(s).includes('RETURN'));ok(!operations(s).includes('RESTORE'));assert.throws(()=>transition(s,'(restore L1 '+proofs.L1+')','BLOCKED'),{code:'DISPOSITION-RECORDED'});checks++;}run('(retain)');run('(reread ENDING-'+states[0].ending+')');run('(return)');eq(states[0].ending,null);}
run('(dispose DELEGATE)');run('(next-cycle)');mainline(states[0],(_s,c)=>run(c));run('(inspect HELP-4B)');run('(root B204-ROOT-0000)');
for(const ids of [['NEWS-WRITEBACK','FORUM-WRITEBACK','WATER-WRITEBACK','TREE-WRITEBACK'],['HISTORY-A17-1','HISTORY-A17-2','HISTORY-LOCAL','HISTORY-B204','HISTORY-WATER','HISTORY-HUIZHI'],['WET-SOURCE','WET-LIBRARY','WET-HUIZHI','WET-PERSONNEL','WET-OUTSIDE','WET-EXIT']])run('(inspect ('+ids.join(' ')+'))');
run('(inspect R-05)');ok(delivery(states[1]).body.includes('把更正誤當成偏好'));ok(delivery(states[2]).body.includes('把更正误当成偏好'));for(const s of states){ok(delivery(s).body.includes('Do not translate my submitted words.'));ok(delivery(s).body.includes('The Analyst completed the restoration.'));}
run('(inspect R-06)');for(const s of states)ok(delivery(s).body.includes('ABSENCE OF OBSERVATION: NOT ESTABLISHED'));const preComplete=structuredClone(states);
for(let i=1;i<=5;i++)run('(inspect FINAL-0'+i+')');eq(phase(states[0]),'STORY_COMPLETE');for(const s of states){eq(operations(s),['REREAD','JOURNAL','NOTES','RETAIN','STOP']);for(const c of ['(inspect FINAL-05)','(restore L1 '+proofs.L1+')','(select N07)','(return)','(root B204-ROOT-0000)','(next-cycle)','(query S-00)']){assert.throws(()=>transition(s,c,'AFTER-END'),{code:'STORY-COMPLETE'});checks++;}}
run('(reread FINAL-05)');ok(delivery(states[1]).body.includes('我保留了一份它仍留在其中的描述'));run('(notes)');run('(journal)');run('(retain)');run('(stop)');for(const s of states){assert.throws(()=>transition(s,'(reread FINAL-05)','STOPPED'),{code:'STOPPED'});checks++;eq(operations({...s,stopped:false}),['REREAD','JOURNAL','NOTES','RETAIN','STOP']);}
states=preComplete;for(const c of ['(query S-00)','(query 1994-03-17)','(query "顧聞")','(query QH-47)','(query ST-07/14)'])run(c);
for(const id of ['K2-204','QH-47','R0-317','I0-14']){run('(inspect '+id+')');for(const s of states)ok(delivery(s).body.includes((data.optional as Record<string,string>)[id]));}
run('(inspect (QH-47 R0-317 I0-14))');for(const s of states)ok(delivery(s).body.includes('DATA_HEX'));
for(const l of languages){const alias='Q17 {SPECIMEN} {H0}';const s=transition(create(alias,'TERM-LITERAL',l),'(inspect T7-SOURCE)','REQ');ok(delivery(s).body.includes(alias));ok(available(s).includes('HELP-00'));ok(available(s).includes('HELP-01'));}
assert.throws(()=>create('a','t','zh'),{code:'TRANSCRIPT'});checks++;ok(!JSON.stringify(data.records).includes('"warning"'));
const tokens=(x:string)=>x.match(/\b(?:[A-Z][A-Z0-9]*-[A-Z0-9][A-Z0-9-]*|\d{4}-\d{2}-\d{2}|\d{2}:\d{2}(?::\d{2})?|library\.dlu\.edu|aqua\.dlu\.edu|SEARCH)\b/g)?.filter(t=>/\d/.test(t)||['OT-LIB-CARD','OT-SEALS','library.dlu.edu','aqua.dlu.edu','SEARCH'].includes(t)).sort()??[];
for(const [source,pair]of Object.entries(catalog)){eq(pair.length,2);for(const target of pair){ok(!!target);eq(tokens(target),tokens(source));}}
console.log(JSON.stringify({checks,transcripts:languages,canonicalTransitions:revision,eightRestorations:true,threeOrdinaryEndings:true,fourthEnding:true,completionGates:true,unchangedEncodedData:true,playerTextPreserved:true}));
