import catalog from './transcripts/catalog.json' with {type:'json'};
import {Fault,parse,wire,type Expr} from './protocol.ts';
export const languages=['en','zh-TW','zh-CN'] as const;
export type Language=typeof languages[number];
export const transcripts='SUPPORTED TRANSCRIPTS:\nen — English\nzh-TW — 繁體中文\nzh-CN — 简体中文';
export function language(value:unknown):Language {if(value===undefined)return 'en';if(typeof value!=='string'||!languages.includes(value as Language))throw new Fault('TRANSCRIPT','Supported transcripts: en / zh-TW / zh-CN.');return value as Language;}
const entries=catalog as unknown as Record<string,[string,string]>;
// Translate complete prose units only; never substrings inside identifiers or submissions.
export function prose(text:string,locale:Language='en',alias=''):string {
 if(locale==='en')return text;const column=locale==='zh-TW'?0:1;
 const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function unit(value:string):string {
  if(entries[value])return entries[value][column];
  for(const [key,pair]of Object.entries(entries)){
   if(!key.includes('{'))continue;
   if(key.replaceAll('{ALIAS}',alias)===value)return pair[column].replaceAll('{ALIAS}',alias);
   if(!/\{(?:H0|H1|EVENT)\}/.test(key))continue;
   const slots:string[]=[];const pattern=key.split(/(\{(?:ALIAS|H0|H1|EVENT)\})/).map(part=>{if(/^\{(?:H0|H1|EVENT)\}$/.test(part)){slots.push(part);return part==='{EVENT}'?'([-A-Za-z0-9_.:]{1,96})':'(H[0-9]+)'}return escape(part==='{ALIAS}'?alias:part)}).join('');
   const match=value.match(new RegExp('^'+pattern+'$'));if(match){let result=pair[column];slots.forEach((slot,i)=>{result=result.replaceAll(slot,match[i+1])});return result.replaceAll('{ALIAS}',alias);}
  }return value;
 }
 return text.split('\n\n').map(p=>{const t=unit(p);return t!==p?t:p.split('\n').map(unit).join('\n')}).join('\n\n');
}
export function transcriptBody(id:string,body:string,locale:Language='en',alias=''):string {
 if(locale==='en')return body;
 if(id==='INDEX')return body.split('\n').map(line=>{const [ref,...label]=line.split('\t');return ref+'\t'+prose(label.join('\t'),locale,alias)}).join('\n');
 if(id.startsWith('T7-')||['TERMINAL-BINDINGS','NOTE','NOTES','JOURNAL','PROVENANCE'].includes(id))return body;
 if(id==='BATCH'||id==='COMPARISON')return body.split('\n').map(line=>{const x=parse(line,1400000);const child=id==='BATCH'?(x.find(v=>Array.isArray(v)&&v[0]==='id') as Expr[])[1]:x[1];return wire(x.map(v=>Array.isArray(v)&&v[0]==='body'?[v[0],transcriptBody(String(child),String(v[1]),locale,alias)]:v))}).join('\n');
 if(['TREE','LAYOUT','SELECTION'].includes(id))return body.split('\n').map(line=>{if(!line.startsWith('('))return prose(line,locale,alias);try{const tr=(v:Expr):Expr=>Array.isArray(v)?v.map((n,i)=>typeof n==='string'&&((v[0]==='question'&&i===2)||(v[0]==='reply'&&i===1))?prose(n,locale,alias):tr(n)):v;return wire(tr(parse(line)))}catch{return line}}).join('\n');
 return prose(body,locale,alias);
}
