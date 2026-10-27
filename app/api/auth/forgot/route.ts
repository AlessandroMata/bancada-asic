// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,publicOrigin,clientIp,cleanEmail,hasCredentials,newToken,sendMail,mailEnabled,throttle,miss } from '../../../../lib/auth';
export const dynamic='force-dynamic';
// Só existe com e-mail configurado. Resposta sempre igual, para não revelar quais e-mails têm conta.
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 if(!mailEnabled())return Response.json({error:'Recuperação por e-mail não configurada. Peça um novo link ao administrador.'},{status:404});
 try{
  const d=db(),email=cleanEmail((await (req.json() as Promise<any>)).email),ik='forgot:'+clientIp(req);await throttle(d,ik,5);await miss(d,ik);
  if(email&&await hasCredentials(d,email))await sendMail(email,'Redefinição de senha','Use o link para definir uma nova senha (válido por 72 horas):\n'+publicOrigin(req)+'/?convite='+await newToken(d,email,'invite')+'\n\nSe você não pediu, ignore esta mensagem.');
  return Response.json({ok:true});
 }catch(e:any){return Response.json({error:e.message.startsWith('Muitas')?e.message:'Solicitação inválida'},{status:400})}
}
