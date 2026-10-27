// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { env } from 'cloudflare:workers';
import { context,persist } from '../../../lib/context';
import { canScope } from '../../../lib/asic.mjs';
import { sameOrigin } from '../../../lib/http.mjs';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 if(!sameOrigin(req))throw Error('Origem inválida');
 const {s,u,db,version,snapshot}=await context();if(u.role==='Cliente')throw Error('Sem acesso');
 const f=await req.formData(),scope=String(f.get('scope')||'order'),id=String(f.get('record')||f.get('order')||''),category=String(f.get('category')||'Recebimento'),visibility=String(f.get('visibility')||'Interno');
 if(!canScope(s,u,scope,id))throw Error('Sem acesso ao registro');if(!['Recebimento','Evidência de teste','Backup','Embalagem','Comprovante','Laudo'].includes(category))throw Error('Categoria inválida');if(!['Interno','Cliente'].includes(visibility)||category==='Backup'&&visibility!=='Interno')throw Error('Backup é exclusivo da equipe');
 const file=f.get('file') as File;if(!file||file.size>10485760)throw Error('Arquivo ausente ou maior que 10 MB');
 if(category!=='Backup'&&!['image/jpeg','image/png','image/webp','application/pdf','text/plain'].includes(file.type))throw Error('Formato inválido');
 const record=s[scope==='order'?'orders':scope==='asset'?'assets':'lots'].find((x:any)=>x.id===id),key=id+'/'+crypto.randomUUID();
 await (env as any).BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||'application/octet-stream'}});
 record.attachments??=[];record.attachments.push({id:key,name:file.name.slice(0,200),type:file.type,category,visibility,at:new Date().toISOString(),user:u.name});
 if(scope==='order')record.history.push({at:new Date().toISOString(),user:u.name,message:'Anexo: '+file.name});
 try{await persist(db,s,version,snapshot)}catch(e){await (env as any).BUCKET.delete(key);throw e}
 return Response.json({key,registered:true});
 }catch(e:any){return Response.json({error:e.message},{status:400})}}
export async function GET(req:Request){try{
 const {s,u}=await context(),key=new URL(req.url).searchParams.get('key');let record:any,attachment:any,scope='';
 for(const [k,sc] of [['orders','order'],['assets','asset'],['lots','lot']]){const r=s[k].find((r:any)=>r.attachments?.some((a:any)=>a.id===key));if(r){record=r;attachment=r.attachments.find((a:any)=>a.id===key);scope=sc;break}}
 if(!record)return new Response('Não encontrado',{status:404});
 const customer=u.role==='Cliente';if(customer?scope!=='order'||record.client!==u.client||attachment.visibility!=='Cliente'||attachment.category==='Backup':!canScope(s,u,scope,record.id))return new Response('Sem acesso',{status:403});
 const file=await (env as any).BUCKET.get(key);if(!file)return new Response('Não encontrado',{status:404});
 return new Response(file.body,{headers:{'Content-Type':file.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':'attachment; filename*=UTF-8\'\''+encodeURIComponent(attachment.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'"}});
 }catch{return new Response('Sem acesso',{status:403})}}
