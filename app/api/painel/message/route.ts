// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { miss } from '../../../../lib/auth';
import { writeState } from '../../../../lib/storage';
import { clientMessage } from '../../../../lib/asic.mjs';
import { panelWrite,bad } from '../../../../lib/panel';
export const dynamic='force-dynamic';
// Mensagem do cliente pelo painel, sempre vinculada a uma OS aberta dele.
export async function POST(req:Request){
 const body:any=await (req.json() as Promise<any>).catch(()=>({})),a:any=await panelWrite(req,body.code);if(a.res)return a.res;
 try{clientMessage(a.s,a.client.id,{order:body.order,text:body.text});await miss(a.d,a.key);await writeState(a.d,a.s,a.version,a.snapshot)}
 catch(e:any){return bad(e.message,e.message.includes('outra sessão')?409:400)}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
