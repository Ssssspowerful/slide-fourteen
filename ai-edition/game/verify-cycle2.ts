import assert from 'node:assert/strict';
import {available,create,migrateState,operations,transition,type State} from './engine.ts';
import {mainline,proofs,throughP2} from './fixtures.ts';

let checks=0,seq=0;
const ok=(value:unknown)=>{assert.ok(value);checks++};
const eq=(actual:unknown,expected:unknown)=>{assert.deepEqual(actual,expected);checks++};
const step=(state:State,command:string)=>transition(state,command,'CYCLE2-'+(++seq));
const rejected=(state:State,command:string,code='UNMOUNTED')=>{assert.throws(()=>step(state,command),{code});checks++;};
const doneThroughP2=['L1','A1','X1','C1','M1','P1','P2'];
const evidenceThroughP2=[
 'L1-CATALOG','L1-PAPER','L1-CLOSURE','T7-NODES','T7-SOURCE','T7-CUT','T7-LAYOUT',
 'X1-SETS','X1-NEWS','X1-WATER','X1-CONTROL','C1-TRANSFER','S-03','S-07','S-13',
 'precursor-p03','precursor-p07','precursor-m13','M1-MAIL','R-L1','R-A1','R-X1','R-C1',
 'S-14-432326','PUB13','IN14','CCD-01','CCD-02','CCD-03','CCD-04','P2-TAGS','TERMINAL-BINDINGS'
];
const legacyKeys=['actor','alias','copies','counts','cycle','done','ending','events','language','last','layout','notes','obtained','pruned','qref','residue','rev','selected','stopped','v','zero'].sort();
const legacyV201=(s:State):State=>({v:1,language:s.language,actor:s.actor,alias:s.alias,rev:s.rev,cycle:s.cycle,residue:s.residue,done:structuredClone(s.done),obtained:structuredClone(s.obtained),counts:structuredClone(s.counts),copies:structuredClone(s.copies),events:structuredClone(s.events),notes:structuredClone(s.notes),selected:s.selected,pruned:s.pruned,layout:s.layout,qref:s.qref,ending:s.ending,zero:s.zero,stopped:s.stopped,last:structuredClone(s.last)});

let first=create('Cycle Two Analyst','TERM-CYCLE-TWO');
first=step(first,'(inspect T7-SOURCE)');
first=step(first,'(annotate "Retain the unresolved boundary." (T7-SOURCE))');
first=mainline(first,step);
ok(first.done.includes('P3'));ok(first.restoredIndex?.done.includes('P2'));ok(first.restoredIndex?.obtained.includes('CCD-04'));

for(const disposition of ['DELETE','OBSERVE','DELEGATE']){
 const ending=step(first,`(dispose ${disposition})`);ok(!!ending.ending);const returned=step(ending,'(return)');eq(returned.ending,null);eq(returned.cycle,1);eq(returned.done,first.done);ok(returned.done.includes('P3'));eq(returned.alias,first.alias);eq(returned.notes,first.notes);ok(!returned.zero);ok(operations(returned).includes('DISPOSE'));
}

const delegated=step(first,'(dispose DELEGATE)');
const cycleTwo=step(delegated,'(next-cycle)');
eq(cycleTwo.cycle,2);ok(cycleTwo.residue);eq(cycleTwo.cycleEntry,'DELEGATE');eq(cycleTwo.done,[]);eq(cycleTwo.obtained,[]);eq(cycleTwo.alias,'Cycle Two Analyst');eq(cycleTwo.notes.length,1);
for(const id of ['NEWS-RESIDUE','FORUM-RESIDUE','WATER-RESIDUE','HOME-GUIDE','LIN-HOME'])ok(available(cycleTwo).includes(id));
ok(operations(cycleTwo).includes('RESUME-RESTORED-ANALYSIS-INDEX'));ok(!operations(cycleTwo).includes('ROOT'));ok(!operations(cycleTwo).includes('DISPOSE'));

const replay=mainline(structuredClone(cycleTwo),step);
ok(replay.done.includes('P3'));ok(operations(replay).includes('ROOT'));ok(operations(replay).includes('DISPOSE'));ok(!operations(replay).includes('RESUME-RESTORED-ANALYSIS-INDEX'));

let fast=step(cycleTwo,'(resume-restored-analysis-index)');
eq(new Set(fast.done),new Set(doneThroughP2));
for(const id of evidenceThroughP2){ok(fast.obtained.includes(id));ok(!!fast.copies[id]);}
eq(fast.cycle,2);ok(fast.residue);eq(fast.cycleEntry,'DELEGATE');eq(fast.alias,'Cycle Two Analyst');eq(fast.actor,cycleTwo.actor);eq(fast.notes.length,1);eq(fast.qref,first.restoredIndex?.qref);eq(fast.events.slice(0,-1),cycleTwo.events);ok(fast.restoredIndexUsed);
ok(fast.copies['TERMINAL-BINDINGS'].body.includes('A17-1'));ok(fast.copies['TERMINAL-BINDINGS'].body.includes('A17-2'));ok(fast.copies['TERMINAL-BINDINGS'].body.includes('EXECUTING-PROCESS BINDING REGISTER: ()'));
ok(!fast.obtained.includes('OBS-031704'));ok(!('OBS-031704' in fast.copies));ok(!fast.obtained.includes('HELP-4B'));ok(!fast.done.includes('P3'));ok(!fast.zero);ok(!operations(fast).includes('ROOT'));ok(!operations(fast).includes('DISPOSE'));ok(!operations(fast).includes('RESUME-RESTORED-ANALYSIS-INDEX'));
rejected(fast,'(root B204-ROOT-0000)');

// The mounted shortcut is validator-valid state, not a cosmetic completion flag.
let revalidated=structuredClone(fast);
for(const packet of doneThroughP2){revalidated=step(revalidated,`(restore ${packet} ${proofs[packet]})`);ok(revalidated.done.includes(packet));}

const withObserver=step(fast,'(query OBS-031704)');
const premature=step(withObserver,'(inspect HELP-4B)');
rejected(premature,'(root B204-ROOT-0000)');ok(!premature.zero);ok(!operations(premature).includes('ROOT'));
const withPermits=step(withObserver,'(inspect P3-PERMITS)');
rejected(withPermits,'(root B204-ROOT-0000)');ok(!withPermits.zero);

const p3NoPaper=step(withPermits,`(restore P3 ${proofs.P3})`);
ok(p3NoPaper.done.includes('P3'));ok(operations(p3NoPaper).includes('ROOT'));
const softReject=step(p3NoPaper,'(root B204-ROOT-0000)');eq(softReject.last.id,'ROOT');ok(!softReject.zero);

let smoke=step(withPermits,`(restore P3 ${proofs.P3})`);
smoke=step(smoke,'(inspect HELP-4B)');
smoke=step(smoke,'(root B204-ROOT-0000)');
ok(smoke.zero);eq(smoke.last.id,'PRE-SILENCE');ok(smoke.last.body.includes('ROOT ZERO ACCEPTED BY A RETAINED ANALYSIS RECORD'));
for(const id of ['NEWS-WRITEBACK','FORUM-WRITEBACK','WATER-WRITEBACK','TREE-WRITEBACK'])ok(available(smoke).includes(id));
ok(!operations(smoke).includes('ROOT'));rejected(smoke,'(root B204-ROOT-0000)');

let firstCycleRoot=step(first,'(inspect HELP-4B)');
firstCycleRoot=step(firstCycleRoot,'(root B204-ROOT-0000)');eq(firstCycleRoot.last.id,'ROOT');ok(!firstCycleRoot.zero);
let firstCyclePreP3=throughP2(create('First Cycle Root','TERM-FIRST-ROOT'),step);firstCyclePreP3=step(firstCyclePreP3,'(query OBS-031704)');firstCyclePreP3=step(firstCyclePreP3,'(inspect HELP-4B)');firstCyclePreP3=step(firstCyclePreP3,'(root B204-ROOT-0000)');eq(firstCyclePreP3.last.id,'ROOT');ok(firstCyclePreP3.last.body.includes('RETURN PATH: NOT ESTABLISHED'));ok(!firstCyclePreP3.zero);ok(!operations(firstCyclePreP3).includes('ROOT'));

rejected(create('Unauthorized','TERM-NEW'),'(resume-restored-analysis-index)');
const firstThroughP2=throughP2(create('First Cycle','TERM-FIRST'),step);rejected(firstThroughP2,'(resume-restored-analysis-index)');
const noResidue={...cycleTwo,residue:false};rejected(noResidue,'(resume-restored-analysis-index)');

const legacy=legacyV201(cycleTwo);eq(Object.keys(legacy).sort(),legacyKeys);
const migrated=migrateState(legacy);eq(migrated.v,2);eq(migrated.cycleEntry,'DELEGATE');ok(operations(migrated).includes('RESUME-RESTORED-ANALYSIS-INDEX'));eq(migrateState(migrated),migrated);
const legacyFast=step(legacy,'(resume-restored-analysis-index)');ok(legacyFast.done.includes('P2'));ok(!legacyFast.obtained.includes('OBS-031704'));eq(legacyFast.qref,cycleTwo.restoredIndex?.qref);

const prunedJournal=structuredClone(legacy);prunedJournal.events=prunedJournal.events.filter(event=>event.op!=='NEXT-CYCLE');
const prunedMigrated=migrateState(prunedJournal);eq(prunedMigrated.cycleEntry,'DELEGATE');ok(operations(prunedMigrated).includes('RESUME-RESTORED-ANALYSIS-INDEX'));eq(prunedMigrated.restoredIndex?.qref,'LEGACY-CCD04-REQUEST-REFERENCE-UNAVAILABLE');
const invalidLegacy=structuredClone(legacy);invalidLegacy.residue=false;
const invalidMigrated=migrateState(invalidLegacy);eq(invalidMigrated.cycleEntry,null);ok(!operations(invalidMigrated).includes('RESUME-RESTORED-ANALYSIS-INDEX'));rejected(invalidLegacy,'(resume-restored-analysis-index)');

const legacyCycleThree=legacyV201({...cycleTwo,cycle:3});const migratedCycleThree=migrateState(legacyCycleThree);eq(migratedCycleThree.cycleEntry,'DELEGATE');ok(!operations(migratedCycleThree).includes('RESUME-RESTORED-ANALYSIS-INDEX'));
const validLegacyRoot=migrateState(legacyV201(smoke));ok(validLegacyRoot.zero);
const leakedRoot=legacyV201(premature);leakedRoot.zero=true;leakedRoot.events.push({id:'LEGACY-LEAK',op:'ROOT',refs:[]});assert.throws(()=>migrateState(leakedRoot),{code:'CONTINUATION'});checks++;
const reorderedRoot=legacyV201(smoke);const p3EventIndex=reorderedRoot.events.findLastIndex(event=>event.op==='RESTORE'&&event.refs.includes('P3'));const [p3Event]=reorderedRoot.events.splice(p3EventIndex,1);const rootEventIndex=reorderedRoot.events.findLastIndex(event=>event.op==='ROOT');reorderedRoot.events.splice(rootEventIndex+1,0,p3Event,{id:'LEGACY-ROOT-RETRY',op:'ROOT',refs:[]});reorderedRoot.obtained.push('NEWS-WRITEBACK');assert.throws(()=>migrateState(reorderedRoot),{code:'CONTINUATION'});checks++;

const roundTrip=migrateState(JSON.parse(JSON.stringify(fast)) as State);eq(roundTrip,fast);

console.log(JSON.stringify({checks,normalFirstCycle:true,ordinaryEndings:3,delegateNextCycle:true,cycleTwoFullReplay:true,cycleTwoFastResume:true,legacyMigration:true,unauthorizedSkipsRejected:true,rootGateRequiresP3:true,endToEndSmoke:'DELEGATE -> NEXT-CYCLE -> RESTORED INDEX -> OBS -> P3 -> 4-B -> ROOT ZERO'},null,2));
