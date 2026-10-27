// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Origem pública da requisição. Atrás de um túnel/proxy o TLS termina fora do app e o servidor enxerga "http".
// X-Forwarded-Proto só vale para SUBIR de http para https; nunca rebaixa uma conexão que já chegou em https
// (o cabeçalho pode ser forjado por quem acessa o app direto).
export const publicOrigin=req=>{const u=new URL(req.url),https=u.protocol==='https:'||(req.headers.get('x-forwarded-proto')||'').split(',')[0].trim()==='https';return (https?'https':'http')+'://'+u.host};
export const sameOrigin=req=>{const o=req.headers.get('origin');return !!o&&o===publicOrigin(req)};
export const isSecure=req=>publicOrigin(req).startsWith('https:');
