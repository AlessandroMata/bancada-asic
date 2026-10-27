// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { env } from 'cloudflare:workers';
import { miss } from '../../../../lib/auth';
import { writeState } from '../../../../lib/storage';
import { clientOrder,clientPhoto } from '../../../../lib/asic.mjs';
import { panelWrite,bad } from '../../../../lib/panel';
export const dynamic='force-dynamic';
// Foto do cliente pelo painel (multipart: code, order, file), vinculada a uma OS aberta. Só imagens, até 8 MB.
export async function POST(req:Request){
 const f=await req.formData().catch(()=>null);if(!f)return bad('Envio inválido');
 const a:any=await panelWrite(req,f.get('code'));if(a.res)return a.res;
 const file=f.get('file') as File|null;if(!file||typeof file==='string'||file.size>8388608)return bad('Foto ausente ou maior que 8 MB');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))return bad('Envie uma imagem JPG, PNG ou WebP');
 let key='';
 try{
  const o=clientOrder(a.s,a.client.id,f.get('order'));key=o.id+'/'+crypto.randomUUID();
  await (env as any).BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  clientPhoto(a.s,a.client.id,{order:f.get('order'),key,name:file.name,type:file.type});await miss(a.d,a.key);await writeState(a.d,a.s,a.version,a.snapshot);
 }catch(e:any){if(key)await (env as any).BUCKET.delete(key).catch(()=>{});return bad(e.message,e.message.includes('outra sessão')?409:400)}
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
