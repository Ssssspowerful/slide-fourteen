import {readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('./wrangler.jsonc',import.meta.url),'utf8'));
const database=process.env.AGENT_D1_DATABASE_ID?.trim()||config.d1_databases[0].database_id;
if(!database||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(database))throw new Error('AGENT_D1_DATABASE_ID must be the existing Analyst D1 database UUID. Do not use a guessed or example identifier.');
config.d1_databases[0].database_id=database;
await writeFile(new URL('./wrangler.deploy.json',import.meta.url),JSON.stringify(config,null,2)+'\n');
console.log('Prepared Analyst D1 binding and /Agent routing.');
