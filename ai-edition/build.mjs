import {build} from 'esbuild';
await build({entryPoints:['worker.ts'],outfile:'dist/worker.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',external:['cloudflare:workers'],loader:{'.css':'text','.txt':'text'},define:{'process.env.NODE_ENV':'"production"'}});
