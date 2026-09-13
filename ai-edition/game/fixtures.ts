import {create,transition,available,serialize,type State} from './engine.ts';
import {parse,designation} from './protocol.ts';
const ok=(x:unknown)=>{if(!x)throw new Error('Fixture failed')};
let seq=0;
const step=(s:State,c:string)=>transition(s,c,'REQ-'+(++seq));
const read=(s:State,ids:string[],run:typeof step=step)=>{for(let i=0;i<ids.length;i+=8)s=run(s,`(inspect (${ids.slice(i,i+8).map(x=>JSON.stringify(x)).join(' ')}))`);return s};
export const proofs:Record<string,string>={
 L1:'(row C14) (open-loans (Q2 Q1)) (unsupported-closure E14)',
 A1:'(run R4) (unsupported-node N14) (parent N07) (source-closure SC7) (scope INSPECTED-SOURCE)',
 X1:'(precursor P-03) (cycle (W07 W08 N17 N18 W07))',
 C1:'(path (D1 D2 D3)) (public-evidence (S-13 S-07 S-03))',
 M1:'(action SEARCH) (query S-14-432326) (chain (M01 M02 M03 M04 M05 M06)) (excluded (M07))',
 P1:'(record S-14-432326) (violations (COLLECTION-AFTER-ACCESSION OUTSIDE-PUBLIC-SET)) (sources (IN14 PUB13))',
 P2:'(source-reject R74) (retain-analysts (A17-2 A17-1)) (current-binding UNRESOLVED)',
 P3:'(root B-204) (position OBS-031704) (endpoint UNREGISTERED) (supports (MAP-PERMIT READ-PERMIT WATER-PERMIT))'
};
export function mainline(s:State,run:typeof step=step){
 for(const p of ['A1','L1','X1','C1','M1','P1','P2','P3']){
  if(p==='P1')s=run(s,'(query "S-14-432326")');
  if(p==='P2'){for(let i=1;i<=4;i++)s=run(s,`(inspect CCD-0${i})`);}
  if(p==='P3')s=run(s,'(query OBS-031704)');
  const req:Record<string,string[]>={A1:['T7-NODES','T7-SOURCE','T7-CUT','T7-LAYOUT'],L1:['L1-CATALOG','L1-PAPER','L1-CLOSURE'],X1:['X1-SETS','X1-NEWS','X1-WATER','X1-CONTROL'],C1:['C1-TRANSFER','S-03','S-07','S-13','precursor-p03','precursor-p07','precursor-m13'],M1:['M1-MAIL','R-L1','R-A1','R-X1','R-C1'],P1:['PUB13','IN14'],P2:['P2-TAGS','TERMINAL-BINDINGS'],P3:['P3-PERMITS','OBS-031704']};
  s=read(s,req[p],run);s=run(s,`(restore ${p} ${proofs[p]})`);ok(s.done.includes(p));
 }
 return s;
}
