#!/usr/bin/env node
// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Instala/atualiza o ambiente de UM cliente em um servidor com Docker, sem porta pública: o acesso é só por Cloudflare Tunnel.
// Uso: DEPLOY_HOST=usuario@servidor DEPLOY_SSH_KEY=~/.ssh/chave CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_ZONE_ID=… \
//      node deploy/instalar.mjs --slug cliente --domain cliente.exemplo.com.br [--plano pago]
import {execFileSync,execSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {homedir} from 'node:os';
const arg=(n,d='')=>{const i=process.argv.indexOf('--'+n);return i<0?d:process.argv[i+1]};
const slug=arg('slug'),domain=arg('domain'),plano=arg('plano');
const {CLOUDFLARE_API_TOKEN:TOKEN,CLOUDFLARE_ACCOUNT_ID:ACC,CLOUDFLARE_ZONE_ID:ZONE}=process.env;
if(!/^[a-z0-9-]{3,30}$/.test(slug)||!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)||!TOKEN||!ACC||!ZONE)throw Error('Informe --slug, --domain e as variáveis CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_ZONE_ID.');
if(!/^[a-z_][a-z0-9_-]*@[A-Za-z0-9.-]+$/.test(process.env.DEPLOY_HOST||''))throw Error('Defina DEPLOY_HOST como usuario@servidor (o servidor com Docker).');
const HOST=process.env.DEPLOY_HOST||'',KEY=(process.env.DEPLOY_SSH_KEY||homedir()+'/.ssh/id_ed25519').replace(/^~/,homedir()),DIR='/opt/clients/'+slug,UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ssh=(cmd,input)=>execFileSync('ssh',['-o','IdentitiesOnly=yes','-o','BatchMode=yes','-i',KEY,HOST,cmd],{encoding:'utf8',input,stdio:['pipe','pipe','pipe'],maxBuffer:64<<20});
// grava em arquivo temporário e troca por mv (atômico; também funciona quando o destino já existe)
const put=(path,content,mode='600')=>ssh(`set -e; umask 077; cat > ${path}.new; chmod ${mode} ${path}.new; mv -f ${path}.new ${path}`,content);
const CF=async(method,path,body)=>{const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+TOKEN,'Content-Type':'application/json',Accept:'application/json','Accept-Language':'pt-BR,pt;q=0.9','User-Agent':UA},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!j.success)throw Error(method+' '+path+' → '+(j.errors||[]).map(e=>e.message).join('; '));return j.result};
// 1) Cloudflare primeiro: se o token não puder escrever, descobrimos antes do build
console.log('1/6 túnel e DNS na Cloudflare');
const tname=slug+'-tunel';const find=n=>CF('GET',`/accounts/${ACC}/cfd_tunnel?name=${n}&is_deleted=false`).then(r=>r[0]);
// aceita o nome antigo (<slug>-hetzner) para não recriar o túnel de ambientes já instalados
let t=await find(tname)||await find(slug+'-hetzner');
if(!t)t=await CF('POST',`/accounts/${ACC}/cfd_tunnel`,{name:tname,config_src:'cloudflare'});
const tunnelToken=t.token||await CF('GET',`/accounts/${ACC}/cfd_tunnel/${t.id}/token`);
await CF('PUT',`/accounts/${ACC}/cfd_tunnel/${t.id}/configurations`,{config:{ingress:[{hostname:domain,service:'http://app:8787'},{service:'http_status:404'}]}});
if(!(await CF('GET',`/zones/${ZONE}/dns_records?name=${domain}`)).length)await CF('POST',`/zones/${ZONE}/dns_records`,{type:'CNAME',name:domain,content:t.id+'.cfargotunnel.com',proxied:true,ttl:1,comment:'Bancada '+slug+' (túnel)'});
// 2) build do app e contexto da imagem
console.log('2/6 build do app');execSync('npm run build',{stdio:'ignore'});
const cfg=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));cfg.name=slug;cfg.topLevelName=slug;
cfg.d1_databases=[{binding:'DB',database_name:slug+'-db',database_id:'00000000-0000-4000-8000-000000000000',migrations_dir:'../../drizzle'}];cfg.r2_buckets=[{binding:'BUCKET',bucket_name:slug+'-fotos'}];
writeFileSync('dist/server/wrangler.docker.json',JSON.stringify(cfg,null,2));
const stage='/tmp/'+slug+'-ctx';rmSync(stage,{recursive:true,force:true});mkdirSync(stage,{recursive:true});
cpSync('dist',stage+'/dist',{recursive:true});cpSync('drizzle',stage+'/drizzle',{recursive:true});cpSync('deploy/docker/Dockerfile',stage+'/Dockerfile');cpSync('deploy/docker/entrypoint.sh',stage+'/entrypoint.sh');
console.log('3/6 enviando e construindo a imagem no servidor');
ssh(`mkdir -p ${DIR}/build ${DIR}/data && chown 1000:1000 ${DIR}/data && chmod 750 ${DIR} && rm -rf ${DIR}/build/*`);
execSync(`tar czf - -C ${stage} . | ssh -o IdentitiesOnly=yes -i ${KEY} ${HOST} "tar xzf - -C ${DIR}/build"`);
const build=ssh(`cd ${DIR}/build && docker build -q -t bancada-${slug}:latest . 2>&1 | tail -2`);console.log('   imagem',build.trim());
rmSync(stage,{recursive:true,force:true});
// 3) arquivos do ambiente: segredos só no servidor, modo 600
console.log('4/6 configuração e segredos');
let setup='';const hasVars=ssh(`test -f ${DIR}/dev.vars && echo sim || echo nao`).trim()==='sim';
if(!hasVars){setup=randomBytes(18).toString('base64url');put(DIR+'/dev.vars',`SETUP_TOKEN=${setup}\n${plano?`PLANO=${plano}\n`:''}`,'600');ssh(`chown 1000:1000 ${DIR}/dev.vars`)}
put(DIR+'/tunnel.env',`TUNNEL_TOKEN=${tunnelToken}\n`);
put(DIR+'/compose.yml',`name: ${slug}
services:
  app:
    image: bancada-${slug}:latest
    container_name: ${slug}-app
    restart: unless-stopped
    volumes: ["./data:/data", "./dev.vars:/app/dist/server/.dev.vars:ro"]
    networks: [internal]
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    mem_limit: 900m
    healthcheck: {test: ["CMD","curl","-fsS","http://127.0.0.1:8787/api/auth/setup"], interval: 30s, timeout: 10s, retries: 5, start_period: 120s}
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: ${slug}-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    env_file: ./tunnel.env
    networks: [internal, default]
    depends_on: {app: {condition: service_healthy}}
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
networks:
  internal: {internal: true}
`,'644');
put(DIR+'/backup.sh',`#!/bin/sh
set -e
D=/opt/backups/${slug}; T=$(date +%F-%H%M); mkdir -p $D
docker exec ${slug}-app sh -c 'rm -rf /data/bk && mkdir -p /data/bk && for f in /data/v3/d1/miniflare-D1DatabaseObject/*.sqlite; do sqlite3 "$f" ".backup /data/bk/$(basename $f)"; done'
tar czf $D/dados-$T.tgz -C ${DIR}/data bk v3/r2
rm -rf ${DIR}/data/bk
find $D -type f -mtime +14 -delete
`,'755');
put(`/etc/cron.d/${slug}-backup`,`40 3 * * * root ${DIR}/backup.sh >> /var/log/${slug}-backup.log 2>&1\n`,'644');
console.log('5/6 subindo os containers (sem portas publicadas)');
console.log(ssh(`cd ${DIR} && docker compose up -d 2>&1 | tail -6`).trim());
console.log('6/6 verificando');
let ok='';for(let i=0;i<40&&!ok;i++){await new Promise(r=>setTimeout(r,5000));try{const r=await fetch('https://'+domain+'/api/auth/setup',{headers:{'User-Agent':UA}});const b=await r.text();if(r.ok&&b.includes('"open"'))ok=b}catch{}}
console.log(ok?'   no ar: https://'+domain+' → '+ok:'   AINDA NÃO RESPONDEU: veja "docker logs '+slug+'-app" e "docker logs '+slug+'-tunnel" no servidor');
console.log(setup?'SETUP_TOKEN (guarde agora; não é exibido de novo): '+setup:'SETUP_TOKEN já existia e foi mantido.');
