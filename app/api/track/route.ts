// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,clientIp,throttle,miss } from '../../../lib/auth';
import {readState} from '../../../lib/storage';
export const dynamic='force-dynamic';
const notFound=(m:string)=>Response.json({error:m},{status:404});
// Consulta pública por token: lê só a OS pedida (não a base inteira) e limita tentativas por IP.
export async function GET(req:Request){
 const token=new URL(req.url).searchParams.get('token');if(!token||token.length<60)return notFound('Link inválido');
 const d=db(),key='track:'+clientIp(req);try{await throttle(d,key,60)}catch{return Response.json({error:'Muitas consultas. Aguarde alguns minutos.'},{status:429})}
 await miss(d,key);
 const store=await d.prepare('SELECT data FROM store WHERE id=1').first();if(!store)return notFound('Ordem não encontrada');
 let o:any;
 if(JSON.parse(store.data).format==='records-v2'){const row=await d.prepare("SELECT data FROM records WHERE collection='orders' AND json_extract(data,'$.token')=?").bind(token).first();o=row&&JSON.parse(row.data)}
 else o=(await readState(d)).s.orders.find((x:any)=>x.token===token);
 if(!o)return notFound('Ordem não encontrada');
 return Response.json({number:'OS-'+String(o.number).padStart(4,'0'),status:o.status,due:o.due,note:o.publicNote},{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
