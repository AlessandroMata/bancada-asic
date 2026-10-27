// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,clientIp,cleanEmail,hasUsers,ensureStore,setupToken,setupConfigured,setPassword,passwordError,newToken,cookie,isSecure,throttle,miss,mailEnabled } from '../../../../lib/auth';
import { readState,writeState } from '../../../../lib/storage';
export const dynamic='force-dynamic';
// Estado público mínimo para a tela de entrada: se a configuração inicial está aberta e se há e-mail.
export async function GET(){const d=db();return Response.json({open:setupConfigured()&&!(await hasUsers(d)),mail:mailEnabled()},{headers:{'Cache-Control':'no-store'}})}
// Primeiro administrador: exige o SETUP_TOKEN do servidor e base sem usuários.
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 try{
  const d=db(),b=await (req.json() as Promise<any>),ik='setup:'+clientIp(req);await throttle(d,ik,5);
  if(!setupConfigured()||!setupToken(b.token)){await miss(d,ik);throw Error('Código de configuração inválido')}
  const email=cleanEmail(b.email),name=String(b.name||'').trim();if(!name||!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email))throw Error('Informe nome e e-mail válidos');
  const bad=passwordError(b.password);if(bad)throw Error(bad);
  await ensureStore(d);const {s,version,snapshot}=await readState(d);if(s.users.length)throw Error('A configuração inicial já foi concluída');
  s.users.push({id:crypto.randomUUID(),email,name,role:'Administrador'});await writeState(d,s,version,snapshot);
  await setPassword(d,email,b.password);
  return Response.json({ok:true},{headers:{'Set-Cookie':cookie(await newToken(d,email,'session'),isSecure(req)),'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message},{status:e.message.startsWith('Muitas')?429:400})}
}
