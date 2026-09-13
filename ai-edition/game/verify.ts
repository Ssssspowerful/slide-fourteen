import assert from 'node:assert/strict';
import {create,transition,available,serialize,type State} from './engine.ts';
import {parse,designation} from './protocol.ts';
let checks=0;
const ok=(x:unknown)=>{assert.ok(x);checks++};
let seq=0;
const step=(s:State,c:string)=>transition(s,c,'REQ-'+(++seq));
const read=(s:State,ids:string[])=>{for(let i=0;i<ids.length;i+=8)s=step(s,`(inspect (${ids.slice(i,i+8).map(x=>JSON.stringify(x)).join(' ')}))`);return s};
const proofs:Record<string,string>={
 L1:'(row C14) (open-loans (Q2 Q1)) (unsupported-closure E14)',
 A1:'(run R4) (unsupported-node N14) (parent N07) (source-closure SC7) (scope INSPECTED-SOURCE)',
 X1:'(precursor P-03) (cycle (W07 W08 N17 N18 W07))',
 C1:'(path (D1 D2 D3)) (public-evidence (S-13 S-07 S-03))',
 M1:'(action SEARCH) (query S-14-432326) (chain (M01 M02 M03 M04 M05 M06)) (excluded (M07))',
 P1:'(record S-14-432326) (violations (COLLECTION-AFTER-ACCESSION OUTSIDE-PUBLIC-SET)) (sources (IN14 PUB13))',
 P2:'(source-reject R74) (retain-analysts (A17-2 A17-1)) (current-binding UNRESOLVED)',
 P3:'(root B-204) (position OBS-031704) (endpoint UNREGISTERED) (supports (MAP-PERMIT READ-PERMIT WATER-PERMIT))'
};
function mainline(s:State){
 for(const p of ['A1','L1','X1','C1','M1','P1','P2','P3']){
  if(p==='P1')s=step(s,'(query "S-14-432326")');
  if(p==='P2'){for(let i=1;i<=4;i++)s=step(s,`(inspect CCD-0${i})`);}
  if(p==='P3')s=step(s,'(query OBS-031704)');
  const req:Record<string,string[]>={A1:['T7-NODES','T7-SOURCE','T7-CUT','T7-LAYOUT'],L1:['L1-CATALOG','L1-PAPER','L1-CLOSURE'],X1:['X1-SETS','X1-NEWS','X1-WATER','X1-CONTROL'],C1:['C1-TRANSFER','S-03','S-07','S-13','precursor-p03','precursor-p07','precursor-m13'],M1:['M1-MAIL','R-L1','R-A1','R-X1','R-C1'],P1:['PUB13','IN14'],P2:['P2-TAGS','TERMINAL-BINDINGS'],P3:['P3-PERMITS','OBS-031704']};
  s=read(s,req[p]);s=step(s,`(restore ${p} ${proofs[p]})`);ok(s.done.includes(p));
 }
 return s;
}
const hostile='\") (source B-204) (名';
let s=create(hostile,'TERM-TEST');
ok(!available(s).includes('soc-minutes'));ok(!available(s).includes('P2'));ok(!available(s).includes('R-05'));
assert.throws(()=>step(s,'(inspect FINAL-05)'));checks++;
assert.throws(()=>step(s,'(restore P2 '+proofs.P2+')'));checks++;
assert.throws(()=>designation('a\ncommand'));checks++;
assert.throws(()=>designation('a\u202eb'));checks++;
assert.throws(()=>parse('(index) (dispose DELETE)'));checks++;
assert.throws(()=>parse('('.repeat(30)+'X'+')'.repeat(30)));checks++;
s=step(s,'(inspect T7-SOURCE)');const before=JSON.stringify(s);const first=s.last.body;
s=step(s,'(annotate "The slot may be the whole boundary." (T7-SOURCE))');
s=step(s,'(revise H001 "The closure is local; the reply remains outside its derivation." (T7-SOURCE))');
ok(s.notes[0].status==='SUPERSEDED'&&s.notes[1].previous==='H001');
s=step(s,'(select N07)');s=step(s,'(prune)');s=step(s,'(layout)');ok(s.last.body.includes('answer left after it'));
s=mainline(s);ok(s.done.length===8);ok(s.notes.length===2);
const binding=step(s,'(inspect TERMINAL-BINDINGS)');const expr=parse(binding.last.body.split('\n')[1]);ok(Array.isArray(expr));ok(binding.last.body.includes('\\"'));
assert.throws(()=>step(s,'(restore P2 '+proofs.P2.replace('UNRESOLVED','A17-1')+')'));checks++;
assert.throws(()=>step(s,'(restore X1 (precursor P-03) (cycle (N17 W08 W07 N18 N17)))'));checks++;
let stop=step(s,'(stop)');assert.throws(()=>step(stop,'(index)'));checks++;
let early=step(step(s,'(inspect HELP-4B)'),'(root B204-ROOT-0000)');ok(!early.zero);
for(const value of ['DELETE','OBSERVE','DELEGATE']){const branch=step(s,`(dispose ${value})`);ok(!!branch.ending);ok(branch.last.body.length>400);ok(step(branch,'(return)').ending===null)}
s=step(step(s,'(dispose DELEGATE)'),'(next-cycle)');ok(s.cycle===2&&s.residue&&s.done.length===0&&s.notes.length===2);
s=mainline(s);ok(!step(s,'(root B204-ROOT-0000)').zero);s=step(s,'(inspect HELP-4B)');s=step(s,'(root B204-ROOT-0000)');ok(s.zero);
s=read(s,['NEWS-WRITEBACK','FORUM-WRITEBACK','WATER-WRITEBACK','TREE-WRITEBACK']);
s=read(s,['HISTORY-A17-1','HISTORY-A17-2','HISTORY-LOCAL','HISTORY-B204','HISTORY-WATER','HISTORY-HUIZHI']);
s=read(s,['WET-SOURCE','WET-LIBRARY','WET-HUIZHI','WET-PERSONNEL','WET-OUTSIDE','WET-EXIT']);
let r=step(s,'(inspect R-05)');ok(r.last.body.includes('H001')&&r.last.body.includes('H002'));ok(r.last.body.includes('mistaken a correction'));ok(!r.last.body.includes('PRIVATE REASONING'));
r=step(s,'(inspect R-06)');ok(r.last.body.includes('ABSENCE OF OBSERVATION: NOT ESTABLISHED'));ok(!r.last.body.includes('hand'));
r=step(s,'(inspect WET-PERSONNEL)');ok(r.last.body.includes('blue stamp 7'));
const preComplete=s;
for(let i=1;i<=5;i++)s=step(s,`(inspect FINAL-0${i})`);ok(s.obtained.includes('FINAL-05'));ok(s.last.body.includes('I have kept a description in which it remains.'));
const noNotes=mainline(create('No notes','TERM-EMPTY'));ok(noNotes.done.length===8&&noNotes.notes.length===0);
const batchbase=create('Batch','TERM-BATCH');const a=step(batchbase,'(inspect (L1-CATALOG L1-PAPER))');const b=step(batchbase,'(inspect (L1-PAPER L1-CATALOG))');ok(a.events[0].op===b.events[0].op);ok(a.events[0].refs.length===2);
assert.throws(()=>step(batchbase,'(inspect (L1-CATALOG P3))'));ok(batchbase.obtained.length===0);
s=preComplete;
for(const cmd of ['(query "S-00")','(query "1994-03-17")','(query "Gu Wen")','(query "QH-47")','(query "ST-07/14")'])s=step(s,cmd);
for(const id of ['K2-204','QH-47','R0-317','I0-14']){const d=step(s,`(inspect ${id})`);ok(d.last.body.length>100&&!d.last.body.includes('undefined'));}
ok(serialize(s).wire.startsWith('('));parse(serialize(s).wire);checks++;
console.log(JSON.stringify({checks,mainRoutes:8,ordinaryEndings:3,fullFourthEnding:true,notesOptional:true,aliasEscaping:true,scope:'Deterministic engine fixtures; not a blind player or browser test'},null,2));
