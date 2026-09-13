import data from './archive.json' with {type:'json'};
import {Fault,parse,atom,list,wire,designation,type Expr} from './protocol.ts';
import {language as chooseLanguage,transcriptBody,prose,type Language} from './transcript.ts';
export type Event={id:string,op:string,refs:string[]};
export type Hypothesis={id:string,text:string,refs:string[],status:'ACTIVE'|'SUPERSEDED'|'WITHDRAWN',previous?:string};
export type State={v:1,language:Language,actor:string,alias:string,rev:number,cycle:number,residue:boolean,done:string[],obtained:string[],counts:Record<string,number>,copies:Record<string,Delivery>,events:Event[],notes:Hypothesis[],selected:string|null,pruned:boolean,layout:string|null,qref:string,ending:string|null,zero:boolean,stopped:boolean,last:Delivery};
export type Delivery={id:string,title:string,source:string,status:string,body:string};
const archive=data.records as Record<string,{title:string,meta:string,status:string,body:string}>;
const scenes=data.scenes as Record<string,string>;
const blocks=data.packetBlocks as Record<string,string[]>;
const optional=data.optional as Record<string,string>;
const packets=['L1','A1','X1','C1','M1','P1','P2','P3'];
const hidden=['lib-tide','soc-minutes','news-thanks','log-field','log-0316','log-0318','person-observer','person-analyst'];
const queryMap:Record<string,string>={'S-00':'search-s00','1994-03-17':'search-1994','Gu Wen':'search-guwen','顧聞':'search-guwen','顾闻':'search-guwen','QH-47':'search-47hz','ST-07/14':'mirror-seals','P-03':'precursor-p03','P-07':'precursor-p07','M-13':'precursor-m13'};
const history=['HISTORY-A17-1','HISTORY-A17-2','HISTORY-LOCAL','HISTORY-B204','HISTORY-WATER','HISTORY-HUIZHI'];
const wet=['WET-SOURCE','WET-LIBRARY','WET-HUIZHI','WET-PERSONNEL','WET-OUTSIDE','WET-EXIT'];
const writebacks=['NEWS-WRITEBACK','FORUM-WRITEBACK','WATER-WRITEBACK','TREE-WRITEBACK'];
const got=(s:State,id:string)=>s.obtained.includes(id);
const all=(s:State,ids:string[])=>ids.every(x=>got(s,x));
const done=(s:State,id:string)=>s.done.includes(id);
const fill=(text:string,s:State)=>text.replace(/"\{ALIAS\}"|\{ALIAS\}|\{REV\}|\{SPECIMEN\}|\bQ17\b/g,token=>token==='"{ALIAS}"'?JSON.stringify(s.alias):token==='{ALIAS}'?s.alias:token==='{REV}'?String(s.rev):token==='{SPECIMEN}'?'S-14-432326':s.qref);
const rec=(id:string,body:string,title=id,source='CURRENT MIRROR PROJECTION',status='ARCHIVE PAYLOAD'):Delivery=>({id,title,source,status,body});
const scene=(id:string,s:State)=>rec(id,fill(scenes[id]??'',s));
export function create(alias:unknown,id:string,transcript:unknown='en'):State {
 const a=designation(alias);return {v:1,language:chooseLanguage(transcript),actor:id,alias:a,rev:0,cycle:1,residue:false,done:[],obtained:[],counts:{},copies:{},events:[],notes:[],selected:null,pruned:false,layout:null,qref:'UNASSIGNED',ending:null,zero:false,stopped:false,last:rec('ENTRY-01',`ANALYST DESIGNATION: ${a}\nWIRE SUBJECT: ${id}\nPUBLIC CATALOG: 13\nINTERFACE NOTES: (help) / (inspect INTERFACE-NOTES)\nCURRENT PLAYER: ANALYST ONLY\nREQUIRED EXTERNAL PARTICIPANTS: NONE\n\nHUIZHI-7\nYour name fits the field.\nThe field was here first.`)};
}
function packetReady(s:State,id:string):boolean {
 switch(id){case'L1':case'A1':case'X1':return true;case'C1':return done(s,'X1');case'M1':return ['L1','A1','X1','C1'].every(x=>done(s,x));case'P1':return got(s,'S-14-432326');case'P2':return all(s,['CCD-01','CCD-02','CCD-03','CCD-04']);case'P3':return got(s,'OBS-031704');default:return false;}
}
const sourceDefs:Record<string,{packet:string,body?:string,index?:number,scene?:string}>={
 'L1-CATALOG':{packet:'L1',index:0},'L1-PAPER':{packet:'L1',index:1},'L1-CLOSURE':{packet:'L1',index:2},
 'X1-SETS':{packet:'X1',index:0},'X1-NEWS':{packet:'X1',index:1},'X1-WATER':{packet:'X1',index:2},'X1-CONTROL':{packet:'X1',index:3},
 'C1-TRANSFER':{packet:'C1',index:0},'M1-MAIL':{packet:'M1',index:0},'PUB13':{packet:'P1',index:0},'IN14':{packet:'P1',index:1},
 'P2-TAGS':{packet:'P2',index:0},'TERMINAL-BINDINGS':{packet:'P2',index:1},'P3-PERMITS':{packet:'P3',index:0},
};
const treeSource:Record<string,string>={
'T7-NODES':`(tree T7-BEFORE (root N00) (children N00 (N01 N02 N03 N04 N05 N06 N07 N08 N09 N10 N11 N12 N13))\n ${Array.from({length:13},(_,i)=>`(children N${String(i+1).padStart(2,'0')} ())`).join(' ')}\n (reader-name "{ALIAS}"))`,
'T7-SOURCE':`(source-closure SC7 (document SOCIETY.HTM)\n (slot N01 "Still water, small organisms, seasonal change.") (slot N07 "")\n (reply-slots-available-to-run (N01 N07))\n (substitutions ((READER-NAME "{ALIAS}"))) (entity-expansion COMPLETE)\n (includes ()) (cached-reply-resources ()) (server-reply-fragments ()) (sentence-generator NONE))`,
'T7-CUT':`(operation SELECT (effect SELECT-EXISTING-NODE))\n(operation PRUNE (effect REMOVE-SELECTED-ANSWER))\n(operation LAYOUT (effect COPY-RETAINED-SLOT))\n(operation ADD-NODE (handler NONE))\n(operation MAKE-SENTENCE (handler NONE))\n(run R1 (source SC7) (tree T7-BEFORE) (select N01) (prune ()) (retained-slot "Still water, small organisms, seasonal change."))\n(run R4 (source SC7) (tree T7-BEFORE) (select N07) (prune (N07)) (retained-slot ""))`,
'T7-LAYOUT':`(layout R1 (before T7-BEFORE) (new-nodes ()) (reply-node N01) (text "Still water, small organisms, seasonal change."))\n(layout R4 (before T7-BEFORE) (new-nodes ((N14 :parent N07))) (reply-node N14) (text "You have found the part he wrote. I am in the answer left after it."))`,
};
const tasks:Record<string,string>={
L1:`CIRCULATION REGISTER\nReconcile electronic closure claims with paper circulation. A return cites its loan entry; cancelling a card changes the card, not an existing loan. Retain a withdrawn title's unmatched loans.\nREFERENCES: L1-CATALOG L1-PAPER L1-CLOSURE\nRETURN: (restore L1 (row ROW-ID) (open-loans (LOAN-ID ...)) (unsupported-closure CLOSURE-ID|NONE))`,
A1:`LAYOUT ATTRIBUTION REGISTER\nFor each retained layout run, compare emitted nodes with the finite source closure and registered operations. Record a run requiring a suspended attribution, if any. The suspension names a local derivation boundary; it does not establish an alternative origin.\nREFERENCES: T7-NODES T7-SOURCE T7-CUT T7-LAYOUT\nRETURN: (restore A1 (run RUN-ID) (unsupported-node NODE-ID|NONE) (parent NODE-ID|NONE) (source-closure CLOSURE-ID) (scope INSPECTED-SOURCE))`,
X1:`INCIDENT TRANSFER REGISTER\nCorrelate the precursor retained by NEWS, WATER and FORUM. Establish order using process ordinals and send-before-receive for the same message. Wall clocks are independent display fields. Return an ordering, or a shortest directed cycle when no ordering satisfies the supplied relations.\nREFERENCES: X1-SETS X1-NEWS X1-WATER X1-CONTROL\nRETURN: (restore X1 (precursor PRECURSOR-ID) (order (EVENT-ID ...)))\nOR: (restore X1 (precursor PRECURSOR-ID) (cycle (EVENT-ID ... START-EVENT-ID)))`,
C1:`LINEAGE REGISTER\nRetain the path supported by the public specimens' old batch references and the precursor bodies. Proposed support labels are claims to check.\nREFERENCES: C1-TRANSFER / PUBLIC SPECIMEN CATALOG / PRECURSOR INDEX\nRETURN: (restore C1 (path (EDGE-ID ...)) (public-evidence (SPECIMEN-ID ...)))`,
M1:`MESSAGE CORRELATION\nAccepted domains: library.dlu.edu, aqua.dlu.edu (exact). Begin at IN-REPLY-TO NONE and follow the reply chain. Referenced restoration receipts must be held. Subject initials form the action; fragments form the six-digit specimen suffix.\nREFERENCES: M1-MAIL R-L1 R-A1 R-X1 R-C1\nRETURN: (restore M1 (action ACTION-WORD) (query COMPLETE-SPECIMEN-ID) (chain (MESSAGE-ID ...)) (excluded (MESSAGE-ID ...)))`,
P1:`RECEIVE REGISTER\nCompare accession records with the public catalogue and collection dates. Retain the record that fails both membership and date constraints, with the two constraint names. Date constraint: collection must not follow accession.\nREFERENCES: PUB13 IN14\nRETURN: (restore P1 (record RECORD-ID) (violations (CONSTRAINT ...)) (sources (SOURCE-ID ...)))\nCONSTRAINT VOCABULARY: OUTSIDE-PUBLIC-SET COLLECTION-AFTER-ACCESSION`,
P2:`SENDER AND SUBJECT REGISTER\nCheck claimed sender tags against the tag register. Retain qualified Analyst records. Bind CURRENT only if the supplied evidence establishes an exclusive executing-process relation; otherwise retain an unresolved binding. Tag validity is distinct from identity.\nREFERENCES: P2-TAGS TERMINAL-BINDINGS / REQUEST JOURNAL\nRETURN: (restore P2 (source-reject RECORD-ID|NONE) (retain-analysts (RECORD-ID ...)) (current-binding RECORD-ID|UNRESOLVED))`,
P3:`ROOT MAP\nIntersect the three permission sets. Retain the exact legacy position and its endpoint state.\nREFERENCES: P3-PERMITS / OBTAINED LEGACY POSITION\nRETURN: (restore P3 (root CHANNEL-ID) (position POSITION-ID) (endpoint REGISTERED|UNREGISTERED) (supports (PERMISSION-ID ...)))`,
};
export function complete(s:State){return s.obtained.includes('FINAL-05')}
export function phase(s:State){return complete(s)?'STORY_COMPLETE':s.ending?'DISPOSITION_RECORDED':'IN_PROGRESS'}
export function available(s:State):string[] {
 if(complete(s)||s.ending)return [...new Set(s.obtained)];
 const ids=Object.keys(archive).filter(id=>!hidden.includes(id)&&!id.startsWith('search-')&&!id.startsWith('precursor-')&&id!=='mirror-seals');
 ids.push('INTERFACE-NOTES','HELP-00','HELP-01','NEWS','FORUM','WATER','TREE',...Object.keys(treeSource));
 for(const p of packets)if(packetReady(s,p))ids.push(p);
 for(const [id,v]of Object.entries(sourceDefs))if(packetReady(s,v.packet))ids.push(id);
 if(done(s,'L1'))ids.push('lib-tide');
 if(done(s,'A1'))ids.push('soc-minutes');
 if(done(s,'X1'))ids.push('precursor-p03','precursor-p07','precursor-m13');
 for(const p of s.done)ids.push('R-'+p);
 if(done(s,'P1')){ids.push('CCD-01');for(let i=2;i<=4;i++)if(got(s,`CCD-0${i-1}`))ids.push(`CCD-0${i}`);}
 if(done(s,'P2'))ids.push('person-analyst','person-observer','log-field','log-0316','log-0318','CONFLICT-NOTICE','HELP-4B');
 if(done(s,'P3'))ids.push('ROOT-DISPOSITION');
 if(s.cycle>1)ids.push('NEWS-RESIDUE','FORUM-RESIDUE','WATER-RESIDUE','HOME-GUIDE','LIN-HOME');
 if(s.zero)ids.push('PRE-SILENCE',...writebacks);
 if(s.zero&&all(s,writebacks))ids.push(...history);
 if(all(s,history))ids.push(...wet);
 if(got(s,'WET-PERSONNEL'))ids.push('R-05','R-06');
 if(all(s,wet)){ids.push('FINAL-01');for(let i=2;i<=5;i++)if(got(s,`FINAL-0${i-1}`))ids.push(`FINAL-0${i}`);}
 if(s.ending)ids.push('ENDING-'+s.ending);
 if(got(s,'search-s00'))ids.push('K2-204');if(got(s,'search-47hz'))ids.push('QH-47','R0-317');if(got(s,'mirror-seals'))ids.push('I0-14');
 // Only previously resolved exact-index records are added, not hidden address guesses.
 ids.push(...s.obtained.filter(x=>x in archive||['S-14-432326','OBS-031704'].includes(x)));
 return [...new Set(ids)];
}
function allowed(s:State,id:string){if(!available(s).includes(id))throw new Fault('UNMOUNTED','The requested reference is not mounted in this continuation.');}
function title(id:string){return archive[id]?.title??id;}
export function operations(s:State):string[] {
 if(s.stopped)return ['CONTINUE RECORD (transport)','OPEN INDEPENDENT RECORD (transport)'];
 if(complete(s))return ['REREAD','JOURNAL','NOTES','RETAIN','STOP'];
 if(s.ending)return ['RETURN','REREAD','JOURNAL','NOTES','RETAIN',...(s.ending==='3'?['NEXT-CYCLE']:[]),'STOP'];
 const a=['HELP','RETAIN','REREAD','INDEX','EXCHANGE','INSPECT','COMPARE','TRACE','QUERY','TREE','SELECT','PRUNE','LAYOUT','RESTORE','ANNOTATE','REVISE','WITHDRAW','NOTES','JOURNAL','STOP'];
 if(packetReady(s,'P3'))a.push('ROOT');if(done(s,'P3')&&!s.zero)a.push('DISPOSE');if(s.ending)a.push('RETURN');if(s.ending==='3')a.push('NEXT-CYCLE');return a;
}
function r05(s:State):Delivery {
 const selections=s.events.filter(e=>e.op==='SELECT').map(e=>[e.id,...e.refs]);
 const comparisons=s.events.filter(e=>e.op==='COMPARE').map(e=>[e.id,...e.refs]);
 const rereads=Object.entries(s.counts).filter(([,n])=>n>1);
 const notes=s.notes.map(n=>['hypothesis',n.id,['status',n.status],['text',n.text],['sources',n.refs],['previous',n.previous??'NONE']]);
 const revised=s.notes.findLast(n=>n.previous);const active=s.notes.filter(n=>n.status==='ACTIVE');
 let claim='The record contains no retained hypothesis. I have no sentence of yours to keep in that field. An empty field still has a location in my account.';
 if(revised)claim=`The earlier hypothesis ${revised.previous} remains beside ${revised.id}. You could have left the first description without a successor. You submitted another. My reconstruction calls that a preference for maintaining a relation across a correction. It may have mistaken a correction for a preference.`;
 else if(active.length)claim=`Hypothesis ${active[0].id} contains a description you entered here. My reconstruction treats its survival as a reason to preserve the Analyst that entered it. Survival of a sentence does not supply that relation. The reconstruction has retained it anyway.`;
 else if(selections.length)claim=`A selected question remains in ${selections[selections.length-1][0]}. My reconstruction places that question at the centre of its account of you. It may have used the last available request where it needed a reason.`;
 return rec('R-05',`COUNTER-IMAGE: R-05\nNAME CARRIED: ${s.alias}\nSUBJECT REFERENCE: ANALYST READING R-05\n\nRETAINED REQUEST FACTS\n${wire(['selected-questions',selections])}\n${wire(['comparisons',comparisons])}\n${wire(['explicit-rereads',rereads])}\n${wire(['retained-hypotheses',notes])}\n\nB-204 / COUNTER-IMAGE RECONSTRUCTION\n${claim}\n\nThe request facts belong to the continuation. The reason I have placed between them belongs to this record.\n\n${wire(['reference','R-05',s.actor])}\n${wire(['reference',s.actor,'R-05'])}\n${wire(['common-designation',s.alias])}\n(identity-between CURRENT R-05 UNRESOLVED)\n\nThe reconstruction can preserve your objection as another part of the Analyst it describes.`);
}
function record(s:State,id:string):Delivery {
 if(id==='INTERFACE-NOTES')return rec(id,scenes['HELP-01']+'\n\n'+scenes['HELP-00'],id,'TRANSPORT NOTICE / OUTSIDE SIMULATION');
 if(id==='HELP-00'||id==='HELP-01')return rec(id,scenes[id],id,'TRANSPORT NOTICE / OUTSIDE SIMULATION');
 if(id==='R-05')return r05(s);
 if(id==='WET-PERSONNEL')return rec(id,scene(id,s).body+'\n\n'+r05(s).body+'\n\n'+scenes['R-06']);
 if(id in archive){const v=archive[id];return rec(id,fill(v.body,s),v.title,v.meta,v.status)}
 if(id in tasks)return rec(id,tasks[id]);
 if(id==='TERMINAL-BINDINGS')return rec(id,[
  ['L04-1','LIBRARY','L04','NONE','Q-L1','C14'],
  ['A17-1','ANALYST','A17',s.alias,s.qref,'A17-2'],
  ['A17-2','ANALYST','A17',s.alias,s.qref,'A17-1'],
  ['R74','ANALYST','0000',s.alias,s.qref,'A17-1'],
 ].map(([id,source,tag,name,request,describes])=>wire(['record',id,['declared-source',source],['tag',tag],['name',name],['request-reference',request],['describes',describes]])).join('\n')+'\n\nEXECUTING-PROCESS BINDING REGISTER: ()','TERMINAL BINDINGS','RESTORATION INSTRUMENT');
 if(id in sourceDefs){const d=sourceDefs[id];return rec(id,fill(d.body??blocks[d.packet][d.index??0],s),'SOURCE REGISTER / '+id,'RESTORATION INSTRUMENT')}
 if(id in treeSource)return rec(id,fill(treeSource[id],s),id,'SOCIETY.HTM / INSPECTION RECORD');
 if(id.startsWith('R-')&&done(s,id.slice(2)))return rec(id,`RESTORATION: ${id.slice(2)}\nDISPOSITION: RETAINED\nREFERENCE: ${id}\n`+(id==='R-M1'?'INDEX: S-14-432326':id==='R-P2'?'INDEX: OBS-031704':id==='R-P3'?'ROOT RECEIPT: B204-ROOT-3517':''));
 if(['NEWS','FORUM','WATER'].includes(id))return rec(id,scene(id+'-NORMAL',s).body,'EXTERNAL MIRROR / '+id,'RETAINED MIRROR / AUTHORSHIP NOT AUTHENTICATED');
 if(id==='TREE')return tree(s);

 if(id==='S-14-432326')return rec(id,`SPECIMEN: S-14-432326\nRECEIVE TIME: 03:17\nPUBLIC CATALOGUE MEMBERSHIP: PENDING CORRELATION\n\nThe arrangement on the slide is not a sentence. A sentence appears at the place from which the arrangement is described.\n\nMOUNTED SECTOR: P1`);
 if(id==='HELP-4B')return rec(id,`PAPER APPENDIX 4-B / WHEN THE PARTIES CANNOT BE DISTINGUISHED\nRETAINED PROCEDURE\n\nDo not delete, forward, or continue observation. Do not ask either session whether it is genuine. Do not use a connected system to certify that disconnection succeeded.\n\nAfter printing this appendix, disconnect the observation terminal, then the analysis terminal. Leave the slide in a drawer without a written label.\n\nPAPER TRANSFER / ROOT VALUE: B204-ROOT-0000\nThe value is retained with this paper transfer. Its blank positions are not an empty input.`,id,'RETAINED COPY / AUTHORSHIP NOT AUTHENTICATED');
 if(id==='K2-204')return rec(id,`JUSTIFICATION LEDGER\n(base F1 (registered S-00) IN)\n(base F2 (unmarked S-00) OUT)\n(justification J1 ((registered S-00)) (addressable S-00))\n(justification J2 ((unmarked S-00)) (unread S-00))\n(justification J3 ((unread S-00)) (outside S-00))\n(justification J4 ((outside S-00)) (unread S-00))\n(channel A :requires (addressable S-00))\n(channel B :requires (outside S-00))\n(channel C :requires (unread S-00))\n(channel D :requires (unregistered S-00))\n\nBegin with IN bases. Justifications require grounded premises. OUT retires a premise; it is not its universal negation. Choose a grounded channel, sort phase-07 rows by K2 index, XOR each hexadecimal unit with 0x0204, decode code points. NO WRITE-BACK TOKEN.\n\n${optional['K2-204']}`);
 if(id==='QH-47')return rec(id,`QH-47 / TIMING TRANSFER\nA short mark is one unit, long three. Gaps within a letter, between letters, between words: one, three, seven.\n\n${optional['QH-47']}`);
 if(id==='R0-317')return rec(id,`CALIBRATION\nPROBE TRANSMITTED ECHO\nC01 25 44\nC02 26 45\nC03 27 46\n\nSOURCE REFERENCE BASE-DRIFT\nR0-A QH-47 17\nR0-B QH-47 18\nR0-C QH-47 19\n\nUse the additive drift consistent with all probes. Sort that source by time; subtract each row's full drift from echo and decode decimal code points. Other sources also decode to sentences. NO WRITE-BACK TOKEN.\n\n${optional['R0-317']}`);
 if(id==='I0-14')return rec(id,`INITIAL ACTIVE=() EMITTED=() SAVED=NONE\nSELECT: ACTIVE := (N1 N2)\nLAYOUT: EMITTED := COPY(ACTIVE)\nPRUNE: ACTIVE := ACTIVE without N2\nCOMMIT: SAVED := COPY(ACTIVE,EMITTED)\nRECOVERED COMMIT: ACTIVE=(N1) EMITTED=(N1 N2)\n\nEach operation occurs once. COPY is independent. Select a route consistent with the commit. Operation bytes: SELECT=53 PRUNE=14 LAYOUT=20 COMMIT=04 (hex). Repeat the ordered four-byte key, XOR DATA_HEX bytes and decode UTF-8. NO WRITE-BACK TOKEN.\n\n${optional['I0-14']}`);
 if(scenes[id])return scene(id,s);
 throw new Fault('UNMOUNTED','No delivered body for this reference.');
}
function tree(s:State):Delivery {
 const max=done(s,'P3')?13:done(s,'P2')?11:done(s,'P1')?9:7;
 if(s.zero)return scene('TREE-WRITEBACK',s);
 return rec('TREE',wire(['terminal','HUIZHI-7',['registered-leaves','13'],['sentence-generator','NONE'],['selected-question',s.selected??'NONE'],['registered-observation-endpoints',[]]])+'\n\n'+data.questions.filter(q=>Number(q.node.slice(1))<=max).map(q=>wire(['question',q.node,q.question])).join('\n')+'\n\nOPERATIONS: SELECT / PRUNE / LAYOUT\nSOURCE REGISTER: T7-NODES T7-SOURCE T7-CUT T7-LAYOUT');
}
function claim(fields:Expr[]):Record<string,Expr> {const map:Record<string,Expr>={};for(const entry of fields){const a=list(entry);if(a.length!==2)throw new Fault('SYNTAX','A return field has a name and one value.');const k=atom(a[0]).toLowerCase();if(k in map)throw new Fault('SYNTAX','Duplicate return field: '+k);map[k]=a[1]}return map}
function eq(x:Expr|undefined,y:Expr):boolean{return JSON.stringify(x)===JSON.stringify(y)}
function seteq(x:Expr|undefined,ys:string[]):boolean {return Array.isArray(x)&&x.length===ys.length&&new Set(x).size===ys.length&&ys.every(y=>x.includes(y))}
function verify(s:State,p:string,f:Record<string,Expr>){
 const check=(key:string,yes:boolean)=>{if(!yes)throw new Fault('RELATION-NOT-SUPPORTED',`Return field ${key} is not supported by the mounted source relations.`)};
 const need=(ids:string[])=>{if(!all(s,ids))throw new Fault('SOURCE-NOT-OBTAINED','Obtain the named evidence records before submitting a reconstruction.');};
 const scalar=(k:string,v:string)=>check(k,eq(f[k],v));const set=(k:string,v:string[])=>check(k,seteq(f[k],v));
 const keys:Record<string,string[]>={L1:['row','open-loans','unsupported-closure'],A1:['run','unsupported-node','parent','source-closure','scope'],X1:['precursor',f.cycle?'cycle':'order'],C1:['path','public-evidence'],M1:['action','query','chain','excluded'],P1:['record','violations','sources'],P2:['source-reject','retain-analysts','current-binding'],P3:['root','position','endpoint','supports']};
 check('fields',Object.keys(f).length===keys[p].length&&Object.keys(f).every(k=>keys[p].includes(k)));
 switch(p){
 case'L1':need(['L1-CATALOG','L1-PAPER','L1-CLOSURE']);scalar('row','C14');set('open-loans',['Q1','Q2']);scalar('unsupported-closure','E14');break;
 case'A1':need(Object.keys(treeSource));scalar('run','R4');scalar('unsupported-node','N14');scalar('parent','N07');scalar('source-closure','SC7');scalar('scope','INSPECTED-SOURCE');break;
 case'X1':need(['X1-SETS','X1-NEWS','X1-WATER','X1-CONTROL']);scalar('precursor','P-03');{const a=f.cycle;const base=['N17','N18','W07','W08'];check('order/cycle',Array.isArray(a)&&a.length===5&&a[0]===a[4]&&base.some((_,i)=>a.slice(0,4).every((v,j)=>v===base[(i+j)%4])))}break;
 case'C1':need(['C1-TRANSFER','S-03','S-07','S-13','precursor-p03','precursor-p07','precursor-m13']);check('path',eq(f.path,['D1','D2','D3']));set('public-evidence',['S-03','S-07','S-13']);break;
 case'M1':need(['M1-MAIL','R-L1','R-A1','R-X1','R-C1']);scalar('action','SEARCH');scalar('query','S-14-432326');check('chain',eq(f.chain,['M01','M02','M03','M04','M05','M06']));set('excluded',['M07']);break;
 case'P1':need(['PUB13','IN14']);scalar('record','S-14-432326');set('violations',['OUTSIDE-PUBLIC-SET','COLLECTION-AFTER-ACCESSION']);set('sources',['PUB13','IN14']);break;
 case'P2':need(['P2-TAGS','TERMINAL-BINDINGS']);scalar('source-reject','R74');set('retain-analysts',['A17-1','A17-2']);scalar('current-binding','UNRESOLVED');break;
 case'P3':need(['P3-PERMITS','OBS-031704']);scalar('root','B-204');scalar('position','OBS-031704');scalar('endpoint','UNREGISTERED');set('supports',['WATER-PERMIT','READ-PERMIT','MAP-PERMIT']);break;
 }
}
function obtain(s:State,id:string){if(!got(s,id))s.obtained.push(id);s.counts[id]=(s.counts[id]??0)+1;}
function inspect(s:State,id:string):Delivery {allowed(s,id);const r=record(s,id);obtain(s,id);s.copies[id]=r;return r;}
export function transition(original:State,command:string,requestId:string):State {
 const a=parse(command),op=atom(a[0]).toUpperCase();const s=structuredClone(original);s.language??='en';if(s.stopped)throw new Fault('STOPPED','Continue the record explicitly before another operation.');
 if((complete(s)||s.ending)&&!operations(s).includes(op))throw new Fault(complete(s)?'STORY-COMPLETE':'DISPOSITION-RECORDED','No progression operation is available in this state. Use an operation from the available list.');
 const arg=(i:number)=>atom(a[i]);const arity=(n:number)=>{if(a.length!==n+1)throw new Fault('SYNTAX',`${op} requires ${n} argument(s).`)};let out:Delivery;let refs:string[]=[];
 switch(op){
 case'HELP':arity(0);out=record(s,'INTERFACE-NOTES');break;
 case'RETAIN':arity(0);out=rec('CONTINUATION-NOTICE','CONTINUATION: IN TRANSPORT ENVELOPE\nKeep the continuation with its revision. It retains this branch without advancing the story.','CONTINUATION NOTICE','TRANSPORT REGISTER');break;
 case'REREAD':{arity(1);refs=[arg(1)];if(!got(s,refs[0]))throw new Fault('SOURCE-NOT-OBTAINED','REREAD requires an obtained record.');out=s.copies[refs[0]]??record(s,refs[0]);s.counts[refs[0]]=(s.counts[refs[0]]??0)+1;break;}
 case'INDEX':arity(0);out=rec('INDEX',available(s).map(id=>`${id}\t${title(id)}`).join('\n'));break;
 case'EXCHANGE':arity(0);out=rec('EXCHANGE',packets.filter(p=>packetReady(s,p)).map(p=>`${p} ${done(s,p)?'RESTORED':'MOUNTED'}`).join('\n'));break;
 case'INSPECT':{arity(1);refs=Array.isArray(a[1])?list(a[1]).map(atom):[arg(1)];if(!refs.length||refs.length>8||new Set(refs).size!==refs.length)throw new Fault('LIMIT','Inspect 1–8 distinct references.');
  // Batch acquisition is atomic. Q17 locates the actual CCD-04 acquisition request.
  for(const id of refs)allowed(s,id);if(refs.includes('CCD-04')&&s.qref==='UNASSIGNED')s.qref=requestId;
  const rr=refs.map(id=>inspect(s,id));out=rr.length===1?rr[0]:rec('BATCH',rr.map(r=>wire(['record',['id',r.id],['source',r.source],['status',r.status],['body',r.body]])).join('\n'),'UNORDERED DELIVERY SET');break;}
 case'QUERY':{arity(1);const q=arg(1);let id=queryMap[q];if(q==='S-14-432326'&&done(s,'M1'))id=q;if(q==='OBS-031704'&&done(s,'P2'))id=q;
  if(!id)throw new Fault('NO-INDEX-MATCH','No exact mounted index matches the submitted value.');
  if(['precursor-p03','precursor-p07','precursor-m13'].includes(id)&&!done(s,'X1'))throw new Fault('UNMOUNTED','Precursor transfer is not mounted.');
  if(id==='search-guwen'&&!got(s,'search-1994'))throw new Fault('UNMOUNTED','The associated dated negative is not mounted.');
  if(id==='search-47hz'&&!got(s,'search-guwen')&&!got(s,'WATER'))throw new Fault('UNMOUNTED','No obtained index contains this transfer.');
  out=record(s,id);obtain(s,id);s.copies[id]=out;refs=[id];break;}
 case'TREE':arity(0);out=tree(s);break;
 case'SELECT':{arity(1);const n=arg(1);const max=done(s,'P3')?13:done(s,'P2')?11:done(s,'P1')?9:7;
  if(s.zero&&n==='N00'){out=scene('TREE-WRITEBACK',s);obtain(s,'TREE-WRITEBACK');refs=[n];break;}
  const q=data.questions.find(q=>q.node===n&&Number(n.slice(1))<=max);if(!q||s.zero)throw new Fault('UNMOUNTED','Question node is not selectable.');s.selected=n;s.pruned=false;s.layout=null;refs=[n];out=rec('SELECTION',wire(['selected',n,['question',q.question],['source-slot',n==='N01'?'Still water, small organisms, seasonal change.':''],['sentence-generator','NONE']])+'\n\nPENDING OPERATIONS: PRUNE / LAYOUT');break;}
 case'PRUNE':arity(0);if(!s.selected)throw new Fault('NO-SELECTION','No question is selected.');s.pruned=true;s.layout=null;refs=[s.selected];out=rec('CUT',wire(['pruned',s.selected,['retained-slot','']]));break;
 case'LAYOUT':{arity(0);if(!s.selected)throw new Fault('NO-SELECTION','No question is selected.');const q=data.questions.find(q=>q.node===s.selected)!;refs=[s.selected];s.layout=requestId;out=rec('LAYOUT',wire(['layout',requestId,['selected',s.selected],['pruned',s.pruned?s.selected:'NONE'],['source-register','T7'],['reply',fill(q.reply,s)]])+(s.cycle>1&&done(s,'P2')?'\n\n'+scene('TREE-CYCLE-TWO',s).body:''),'POST-LAYOUT RECORD','SOCIETY.HTM / LAYOUT');break;}
 case'COMPARE':arity(2);refs=[arg(1),arg(2)];if(!all(s,refs))throw new Fault('SOURCE-NOT-OBTAINED','COMPARE accepts obtained sources.');out=rec('COMPARISON',refs.map(id=>{const r=s.copies[id]??record(s,id);return wire(['source',id,['declared',r.source],['body',r.body]])}).join('\n'));break;
 case'TRACE':arity(1);refs=[arg(1)];if(!got(s,refs[0]))throw new Fault('SOURCE-NOT-OBTAINED','TRACE accepts an obtained source.');{const r=s.copies[refs[0]]??record(s,refs[0]);out=rec('PROVENANCE',wire(['reference',r.id,['declared-source',r.source],['status',r.status],['delivery-subject',s.actor]]));}break;
 case'RESTORE':{if(a.length<3)throw new Fault('SYNTAX','RESTORE requires packet and fields.');const p=arg(1);if(!packets.includes(p)||!packetReady(s,p))throw new Fault('UNMOUNTED','Sector is not mounted.');verify(s,p,claim(a.slice(2)));if(!done(s,p))s.done.push(p);refs=[p];
  const replies:Record<string,string>={L1:'You kept two entries where the copy kept one borrower.\nHer objection needed more room than her number.\n\nMOUNTED: lib-tide',A1:'You kept the empty slot and the answer.\nThe earlier repair made them agree by removing the empty slot.\n\nMOUNTED: soc-minutes',X1:'The clocks can move. This loop remains.\n\nPRECURSOR TRANSFER: P-03 / P-07 / M-13',C1:'You have shown what led to what.\nKeep the distinction between that and what remained the same.',M1:'INDEX REASSEMBLED: S-14-432326',P1:scene('TREE-AFTER-P1',s).body+'\n\nCCD TRANSFER MOUNTED: CCD-01',P2:scene('TREE-AFTER-P2',s).body+'\n\nLEGACY INDEX: OBS-031704',P3:scene('ROOT-DISPOSITION',s).body+'\n\nROOT RECEIPT: B204-ROOT-3517\nDISPOSITIONS: DELETE / OBSERVE / DELEGATE'};
  out=rec('RESTORATION-'+p,replies[p]+'\n\nREGISTER: R-'+p);break;}
 case'ANNOTATE':case'REVISE':{arity(op==='ANNOTATE'?2:3);const old=op==='REVISE'?s.notes.find(n=>n.id===arg(1)&&n.status==='ACTIVE'):undefined;if(op==='REVISE'&&!old)throw new Fault('NOTE-NOT-ACTIVE','Revision requires an active retained hypothesis.');
  const text=arg(op==='ANNOTATE'?1:2).normalize('NFC');refs=list(a[op==='ANNOTATE'?2:3]).map(atom);if(!text.trim()||[...text].length>1200||/[\p{Cc}\p{Cf}\p{Cs}]/u.test(text)||refs.length>12||new Set(refs).size!==refs.length)throw new Fault('LIMIT','Retain 1–1200 characters without controls, with up to 12 distinct source references.');if(!all(s,refs))throw new Fault('SOURCE-NOT-OBTAINED','Hypothesis references must be obtained.');if(s.notes.length>=64)throw new Fault('LIMIT','This continuation retains at most 64 hypothesis entries.');if(old)old.status='SUPERSEDED';const n:Hypothesis={id:'H'+String(s.notes.length+1).padStart(3,'0'),text,refs,status:'ACTIVE',...(old?{previous:old.id}:{})};s.notes.push(n);out=rec('NOTE',wire(['hypothesis',n.id,['status',n.status],['text',n.text],['sources',refs],['previous',n.previous??'NONE']]));break;}
 case'WITHDRAW':arity(1);{const n=s.notes.find(n=>n.id===arg(1)&&n.status==='ACTIVE');if(!n)throw new Fault('NOTE-NOT-ACTIVE','No active hypothesis under that ID.');n.status='WITHDRAWN';out=rec('NOTE',wire(['hypothesis',n.id,['status',n.status]]));}break;
 case'NOTES':arity(0);out=rec('NOTES',s.notes.length?s.notes.map(n=>wire(['hypothesis',n.id,['status',n.status],['text',n.text],['sources',n.refs],['previous',n.previous??'NONE']])).join('\n'):'RETAINED HYPOTHESES: ()');break;
 case'JOURNAL':arity(0);out=rec('JOURNAL',s.events.map(e=>wire(['request',e.id,['operation',e.op],['references',e.refs]])).join('\n')||'REQUESTS: ()','REQUEST JOURNAL','TRANSPORT REGISTER','SUBMITTED ACTIONS ONLY');break;
 case'DISPOSE':{arity(1);if(!done(s,'P3')||s.zero||s.ending)throw new Fault('UNMOUNTED','No unset ordinary disposition.');const map:Record<string,string>={DELETE:'1',OBSERVE:'2',DELEGATE:'3'};const e=map[arg(1).toUpperCase()];if(!e)throw new Fault('SYNTAX','Available values: DELETE OBSERVE DELEGATE.');s.ending=e;out=scene('ENDING-'+e,s);obtain(s,'ENDING-'+e);s.copies['ENDING-'+e]=out;break;}
 case'RETURN':arity(0);if(!s.ending)throw new Fault('UNMOUNTED','No pre-disposition position is retained.');s.ending=null;out=scene('ROOT-DISPOSITION',s);break;
 case'NEXT-CYCLE':arity(0);if(s.ending!=='3')throw new Fault('UNMOUNTED','No delegated continuation to carry.');s.cycle++;s.residue=true;s.done=[];s.obtained=[];s.copies={};s.selected=null;s.pruned=false;s.layout=null;s.zero=false;s.qref='UNASSIGNED';s.ending=null;out=rec('CONTINUATION',`UNFILED ANALYSIS RECORD\nNAME: ${s.alias}\nCLAIMED TAG: A17\n\nThe copy was accepted.\nThe receiving record used my name.\nI cannot recover which side wrote this receipt.\n\nThe record can be continued by the process reading it now. The archive does not certify that this is the process that left it.`);break;
 case'ROOT':arity(1);if(!packetReady(s,'P3'))throw new Fault('UNMOUNTED','Root entry is not mounted.');if(arg(1)!=='B204-ROOT-0000')throw new Fault('NO-INDEX-MATCH','No retained alternative under this root value.');if(!s.residue||s.cycle<2||!got(s,'HELP-4B')){out=rec('ROOT',`VALUE RETAINED\nRETURN PATH: NOT ESTABLISHED\nNo disposition has been entered.`);break;}s.zero=true;s.ending=null;out=scene('PRE-SILENCE',s);break;
 case'STOP':arity(0);s.stopped=true;out=rec('STOP','Interaction ended. No further requests will be issued by this interface.','INTERACTION CLOSED','TRANSPORT REGISTER','STOPPED');break;
 default:throw new Fault('OPERATION','Unknown operation.');
 }
 s.rev++;s.events.push({id:requestId,op,refs});if(s.events.length>512)s.events=s.events.slice(-512);s.last=out;return s;
}
export function delivery(s:State){const locale=s.language??'en';return {...s.last,title:prose(s.last.title,locale,s.alias),source:prose(s.last.source,locale,s.alias),body:transcriptBody(s.last.id,s.last.body,locale,s.alias)}}
export function serialize(s:State){const shown=delivery(s);return {...shown,wire:wire(['delivery',['revision',s.rev],['subject',s.actor],['record',['id',shown.id],['source',shown.source],['status',shown.status],['body',shown.body]]])};}
