// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { sameOrigin,publicOrigin,cleanEmail,newToken,sendMail,mailEnabled } from '../../../../lib/auth';
import { context } from '../../../../lib/context';
export const dynamic='force-dynamic';
// Administrador gera o link de definição de senha (convite ou redefinição). O envio por e-mail é opcional.
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const {s,u,db}=await context();if(u.role!=='Administrador')throw Error('Operação exige administrador');
  const b=await (req.json() as Promise<any>),email=cleanEmail(b.email),target=s.users.find((x:any)=>x.email===email);if(!target)throw Error('Usuário não encontrado');
  const link=publicOrigin(req)+'/?convite='+await newToken(db,email,'invite');let sent=false;
  if(b.send===true){await sendMail(email,'Defina sua senha de acesso','Olá, '+target.name+'.\n\nDefina sua senha para acessar o sistema (link válido por 72 horas):\n'+link);sent=true}
  return Response.json({link,sent,mail:mailEnabled()},{headers:{'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message},{status:e.message==='AUTH'?401:400})}
}
