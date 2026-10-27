// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,clientIp,cleanEmail,checkPassword,newToken,cookie,isSecure,throttle,miss,hit } from '../../../../lib/auth';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const d=db(),b=await (req.json() as Promise<any>),email=cleanEmail(b.email),ek='email:'+email,ik='ip:'+clientIp(req);
  await throttle(d,ek,5);await throttle(d,ik,30);
  if(!email||!(await checkPassword(d,email,String(b.password||'')))){await miss(d,ek);await miss(d,ik);return Response.json({error:'E-mail ou senha incorretos'},{status:401})}
  await hit(d,ek);
  return Response.json({ok:true},{headers:{'Set-Cookie':cookie(await newToken(d,email,'session'),isSecure(req)),'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message.startsWith('Muitas')?e.message:'Solicitação inválida'},{status:e.message.startsWith('Muitas')?429:400})}
}
