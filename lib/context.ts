// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { headers } from 'next/headers';
import { db, sessionEmail, ensureStore } from './auth';
import { readState, writeState } from './storage';
export async function context(){
 const d=db(),email=await sessionEmail(d,(await headers()).get('cookie'));if(!email)throw new Error('AUTH');
 await ensureStore(d);
 const loaded=await readState(d),s=loaded.s,u=s.users.find((x:any)=>x.email===email);
 if(!u||u.role==='Desativado')throw new Error('Usuário sem acesso. Solicite cadastro ao administrador.');
 return {s,u,db:d,version:loaded.version,snapshot:loaded.snapshot};
}
export const persist=writeState;
