// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,tokenEmail,setPassword,passwordError,dropTokens,newToken,cookie,isSecure } from '../../../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){const email=await tokenEmail(db(),new URL(req.url).searchParams.get('token')||'','invite');return email?Response.json({email}):Response.json({error:'Convite inválido ou expirado'},{status:404})}
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const d=db(),b=await (req.json() as Promise<any>),email=await tokenEmail(d,String(b.token||''),'invite');if(!email)throw Error('Convite inválido ou expirado');
  const bad=passwordError(b.password);if(bad)throw Error(bad);
  await setPassword(d,email,b.password);await dropTokens(d,email);
  return Response.json({ok:true},{headers:{'Set-Cookie':cookie(await newToken(d,email,'session'),isSecure(req)),'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message},{status:400})}
}
