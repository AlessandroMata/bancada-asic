// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { sameOrigin,checkPassword,setPassword,passwordError,dropTokens,newToken,cookie,isSecure,throttle,miss,hit } from '../../../../lib/auth';
import { context } from '../../../../lib/context';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const {u,db}=await context(),b=await (req.json() as Promise<any>),key='pwd:'+u.email;await throttle(db,key,5);
  if(!(await checkPassword(db,u.email,String(b.current||'')))){await miss(db,key);throw Error('Senha atual incorreta')}
  const bad=passwordError(b.next);if(bad)throw Error(bad);
  await hit(db,key);await setPassword(db,u.email,b.next);await dropTokens(db,u.email,'session');
  return Response.json({ok:true},{headers:{'Set-Cookie':cookie(await newToken(db,u.email,'session'),isSecure(req)),'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message==='AUTH'?'Sessão expirada':e.message},{status:e.message==='AUTH'?401:400})}
}
