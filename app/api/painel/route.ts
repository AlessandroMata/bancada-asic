// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,clientIp,throttle,miss } from '../../../lib/auth';
import { paidPlan } from '../../../lib/plan';
import { readState } from '../../../lib/storage';
import { publicPanel,panelCodeFrom } from '../../../lib/asic.mjs';
export const dynamic='force-dynamic';
const gone=()=>Response.json({error:'Código inválido ou painel desativado'},{status:404});
// Painel do cliente (versão paga), acesso pelo código. POST para o código não ir na URL do servidor.
// Bloqueio por IP só nas tentativas erradas: 10 a cada 15 min. Não bloqueia por código (qualquer um travaria o painel alheio);
// a defesa contra adivinhação distribuída é a entropia do código (~59 bits).
export async function POST(req:Request){
 if(!paidPlan())return gone();
 const d=db(),key='painel:'+clientIp(req),body:any=await (req.json() as Promise<any>).catch(()=>({}));
 try{await throttle(d,key,10)}catch{return Response.json({error:'Muitas tentativas. Tente novamente em 15 minutos.'},{status:429,headers:{'Retry-After':'900'}})}
 const code=panelCodeFrom(body.code);if(!code){await miss(d,key);return gone()}
 const store=await d.prepare('SELECT data FROM store WHERE id=1').first();if(!store){await miss(d,key);return gone()}
 const meta=JSON.parse(store.data);let state:any;
 if(meta.format==='records-v2'){
  const row=await d.prepare("SELECT data FROM records WHERE collection='clients' AND json_extract(data,'$.panelCode')=? AND json_extract(data,'$.panelEnabled')=1").bind(code).first();if(!row){await miss(d,key);return gone()}
  const client=JSON.parse(row.data),list=async(c:string)=>(await d.prepare("SELECT data FROM records WHERE collection=? AND json_extract(data,'$.client')=?").bind(c,client.id).all()).results.map((r:any)=>JSON.parse(r.data));
  const [orders,assets,lots,shipments]=await Promise.all(['orders','assets','lots','shipments'].map(list));
  state={settings:meta.settings,clients:[client],orders,assets,lots,shipments};
 }else{const s=(await readState(d)).s;if(!s.clients.some((c:any)=>c.panelCode===code&&c.panelEnabled===true)){await miss(d,key);return gone()}state=s}
 const client=state.clients.find((c:any)=>c.panelCode===code&&c.panelEnabled===true);
 return Response.json(publicPanel(state,client.id),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
}
