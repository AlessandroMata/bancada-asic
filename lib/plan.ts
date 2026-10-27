// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { env } from 'cloudflare:workers';
// Versão paga = PLANO=pago no servidor (não fica no banco, para o cliente não se habilitar sozinho).
export const paidPlan=()=>String((env as any).PLANO||'').trim().toLowerCase()==='pago';
