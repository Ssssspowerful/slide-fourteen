import {writeFile} from 'node:fs/promises';
const database=process.env.AGENT_D1_DATABASE_ID;
if(!database||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(database))throw new Error('AGENT_D1_DATABASE_ID must be the existing Analyst D1 database UUID. Do not use a guessed or example identifier.');
const config={name:'slide-fourteen-agent',main:'dist/worker.mjs',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],workers_dev:false,preview_urls:false,vars:{ANALYST_PUBLIC_ORIGIN:'https://slidefourteen.org'},routes:[{pattern:'slidefourteen.org/Agent*',zone_name:'slidefourteen.org'}],d1_databases:[{binding:'DB',database_name:'slide-fourteen-agent',database_id:database,migrations_dir:'migrations'}]};
await writeFile('wrangler.deploy.json',JSON.stringify(config,null,2)+'\n');
console.log('Prepared /Agent routing only. Existing domain registration and human origin are unchanged by this file.');
