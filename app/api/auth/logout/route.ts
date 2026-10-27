// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { db,sameOrigin,readCookie,dropToken,cookie,isSecure } from '../../../../lib/auth';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 const t=readCookie(req.headers.get('cookie'));if(t)await dropToken(db(),t);
 return Response.json({ok:true},{headers:{'Set-Cookie':cookie(null,isSecure(req))}});
}
