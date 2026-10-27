// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,cleanEmail,checkPassword,hasCredentials,dropTokens,newToken,cookie,isSecure,throttle,miss,hit } from '../../../../lib/auth';
import { context,persist } from '../../../../lib/context';
export const dynamic='force-dynamic';
// Troca do e-mail de acesso do próprio usuário (equipe). Exige a senha atual. Clientes do portal pedem à assistência,
// porque o e-mail deles também está na lista de aprovadores dos contratos.
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const {s,u,db:d,version,snapshot}=await context(),b:any=await (req.json() as Promise<any>),next=cleanEmail(b.email),old=u.email,key='pwd:'+old;
  if(u.role==='Cliente')throw Error('A troca de e-mail do portal é feita pela assistência');
  await throttle(d,key,5);
  if(!(await checkPassword(d,old,String(b.password||'')))){await miss(d,key);throw Error('Senha atual incorreta')}
  if(!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(next))throw Error('E-mail inválido');
  if(next===old)throw Error('Informe um e-mail diferente do atual');
  if(s.users.some((x:any)=>x.email===next)||await hasCredentials(d,next))throw Error('Este e-mail já está em uso');
  await hit(d,key);
  u.email=next;await persist(d,s,version,snapshot);
  await d.prepare('UPDATE credentials SET email=? WHERE email=?').bind(next,old).run();
  await dropTokens(d,old);
  return Response.json({ok:true,email:next},{headers:{'Set-Cookie':cookie(await newToken(d,next,'session'),isSecure(req)),'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message==='AUTH'?'Sessão expirada':e.message},{status:e.message==='AUTH'?401:e.message.startsWith('Muitas')?429:400})}
}
