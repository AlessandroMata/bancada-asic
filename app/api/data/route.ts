// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { mutate } from '../../../lib/domain.mjs';
import { upgrade,asicMutate,beforeLegacy,visibleState } from '../../../lib/asic.mjs';
import {context,persist} from '../../../lib/context';
import {paidPlan} from '../../../lib/plan';
import {resolved} from '../../../lib/perms.mjs';
import {sameOrigin} from '../../../lib/http.mjs';
export const dynamic='force-dynamic';
const json=(d:any,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const {s,u}=await context();return json({data:visibleState(s,u),user:{...u,can:resolved(u)},paid:paidPlan()})}catch(e:any){return json({error:e.message},e.message==='AUTH'?401:403)}}
export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Origem inválida'},403);
 const raw=await req.text();if(raw.length>300000)return json({error:'Solicitação muito grande'},413);const p=JSON.parse(raw);if(typeof p.action!=='string')throw Error('Operação inválida');
 if(p.action==='asic_panel'&&!paidPlan())return json({error:'O painel do cliente é um recurso da versão paga'},402);
 const {s,u,db,version,snapshot}=await context();if(!asicMutate(s,u,p.action,p.payload||{})){beforeLegacy(s,u,p.action,p.payload||{});mutate(s,u,p.action,p.payload||{});s.audit.push({id:crypto.randomUUID(),at:new Date().toISOString(),user:u.name,userId:u.id,message:'Operação: '+p.action,order:p.payload?.id||null})}
 await persist(db,s,version,snapshot);return json({data:visibleState(s,u),user:{...u,can:resolved(u)},paid:paidPlan()});
 }catch(e:any){return json({error:e.message},e.message==='AUTH'?401:e.message.includes('outra sessão')?409:400)}}
