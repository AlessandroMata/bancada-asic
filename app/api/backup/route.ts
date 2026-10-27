// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import {context} from '../../../lib/context';
export const dynamic='force-dynamic';
export async function GET(){try{const {s,u}=await context();if(u.role!=='Administrador')return new Response('Sem acesso',{status:403});return new Response(JSON.stringify({format:'bancada-asic-v1',exported:new Date().toISOString(),data:s},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename=bancada-backup.json','Cache-Control':'no-store'}})}catch{return new Response('Sem acesso',{status:403})}}
