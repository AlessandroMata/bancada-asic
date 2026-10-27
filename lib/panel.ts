// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,clientIp,throttle,miss } from './auth';
import { paidPlan } from './plan';
import { readState } from './storage';
import { panelCodeFrom } from './asic.mjs';
export const gone=()=>Response.json({error:'Código inválido ou painel desativado'},{status:404});
export const bad=(m:string,status=400)=>Response.json({error:m},{status});
// Acesso de escrita do painel do cliente: confere plano, bloqueio por IP (só erros) e código; limita 30 envios por cliente a cada 15 min.
export async function panelWrite(req:Request,rawCode:unknown){
 if(!paidPlan())return {res:gone()};
 const d=db(),ipKey='painel:'+clientIp(req);
 try{await throttle(d,ipKey,10)}catch{return {res:bad('Muitas tentativas. Tente novamente em 15 minutos.',429)}}
 const code=panelCodeFrom(rawCode);if(!code){await miss(d,ipKey);return {res:gone()}}
 const loaded=await readState(d),client=loaded.s.clients.find((c:any)=>c.panelEnabled===true&&c.panelCode===code);
 if(!client){await miss(d,ipKey);return {res:gone()}}
 const key='pmsg:'+client.id;try{await throttle(d,key,30)}catch{return {res:bad('Muitos envios em pouco tempo. Aguarde alguns minutos.',429)}}
 return {d,client,key,...loaded};
}
