#!/usr/bin/env node
// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Cria/atualiza o ambiente de UM cliente na Cloudflare: Worker, banco D1 e bucket R2 próprios, domínio e segredos.
// Uso: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node deploy/cliente.mjs --slug cliente --domain cliente.exemplo.com.br [--plano pago] [--dry-run]
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf('--'+n);return i<0?d:(process.argv[i+1]?.startsWith('--')||process.argv[i+1]==null?true:process.argv[i+1])};
const slug=arg('slug'),domain=arg('domain'),plano=arg('plano',''),dry=arg('dry-run',false)===true;
if(!/^[a-z0-9-]{3,30}$/.test(slug||'')||!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain||''))throw Error('Informe --slug (a-z, 0-9, -) e --domain');
const W='node_modules/.bin/wrangler',CFG='dist/server/wrangler.json',OUT='dist/server/wrangler.deploy.json';
const wr=(args,opt={})=>execFileSync(W,args,{encoding:'utf8',stdio:opt.input?['pipe','pipe','pipe']:['ignore','pipe','pipe'],...opt});
const tolerate=(fn,okRe)=>{try{return fn()}catch(e){const m=String(e.stderr||e.message);if(okRe.test(m))return '(já existe)';throw Error(m.slice(0,400))}};
if(!existsSync(CFG))throw Error('Rode "npm run build" antes.');
if(!dry&&(!process.env.CLOUDFLARE_API_TOKEN||!process.env.CLOUDFLARE_ACCOUNT_ID))throw Error('Defina CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID.');
const db=slug+'-db',bucket=slug+'-fotos';let dbId='00000000-0000-4000-8000-000000000000';
if(!dry){
 console.log('1/6 banco D1',db);tolerate(()=>wr(['d1','create',db]),/already exists/i);
 dbId=JSON.parse(wr(['d1','list','--json'])).find(d=>d.name===db)?.uuid;if(!dbId)throw Error('D1 não encontrado após criar');
 console.log('2/6 bucket R2',bucket);tolerate(()=>wr(['r2','bucket','create',bucket]),/already exists/i);
}
const cfg=JSON.parse(readFileSync(CFG,'utf8'));
cfg.name=slug;cfg.topLevelName=slug;cfg.d1_databases=[{binding:'DB',database_name:db,database_id:dbId,migrations_dir:'../../drizzle'}];cfg.r2_buckets=[{binding:'BUCKET',bucket_name:bucket}];
cfg.routes=[{pattern:domain,custom_domain:true}];cfg.workers_dev=false;writeFileSync(OUT,JSON.stringify(cfg,null,2));
if(dry){console.log('config gerada:',OUT);console.log(wr(['deploy','--dry-run','--config',OUT]).trim().split('\n').slice(-6).join('\n'));process.exit(0)}
console.log('3/6 migrações no banco remoto');console.log(wr(['d1','migrations','apply',db,'--remote','--config',OUT]).trim().split('\n').slice(-4).join('\n'));
console.log('4/6 deploy do Worker e domínio',domain);console.log(wr(['deploy','--config',OUT]).trim().split('\n').slice(-4).join('\n'));
console.log('5/6 segredos');const setup=process.env.SETUP_TOKEN||randomBytes(18).toString('base64url');
wr(['secret','put','SETUP_TOKEN','--config',OUT],{input:setup});if(plano)wr(['secret','put','PLANO','--config',OUT],{input:plano});
console.log('6/6 pronto: https://'+domain);console.log('SETUP_TOKEN (guarde agora, não é exibido de novo):',setup);
