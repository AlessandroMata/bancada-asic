// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { env } from 'cloudflare:workers';
import { empty } from './domain.mjs';
// Login por e-mail e senha. Hash PBKDF2 (100k é o teto do Workers); sessões e convites guardam só o SHA-256 do token.
const ITER=100000,SESSION_MS=30*86400000,INVITE_MS=72*3600000,COOKIE='bancada_session';
const hex=(b:ArrayBuffer)=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const unhex=(h:string)=>Uint8Array.from(h.match(/../g)||[],x=>parseInt(x,16));
const sha=async(t:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));
const randomHex=(n:number)=>hex(crypto.getRandomValues(new Uint8Array(n)).buffer);
async function derive(password:string,salt:Uint8Array){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt as BufferSource,iterations:ITER},key,256))}
const same=(a:string,b:string)=>a.length===b.length&&[...a].reduce((d,c,i)=>d|(c.charCodeAt(0)^b.charCodeAt(i)),0)===0;
const DUMMY_SALT=new Uint8Array(16);
export const db=()=>(env as any).DB;
export const mailEnabled=()=>!!((env as any).RESEND_API_KEY&&(env as any).MAIL_FROM);
export {sameOrigin,isSecure,publicOrigin} from './http.mjs';
export const clientIp=(req:Request)=>req.headers.get('cf-connecting-ip')||'?';
export const cleanEmail=(v:unknown)=>String(v||'').trim().toLowerCase();
export function passwordError(p:unknown){const s=String(p||'');return s.length<10?'A senha precisa ter ao menos 10 caracteres':s.length>128?'A senha pode ter no máximo 128 caracteres':null}
export async function setPassword(d:any,email:string,password:string){const salt=crypto.getRandomValues(new Uint8Array(16));await d.prepare('INSERT INTO credentials (email,hash,salt,updated) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET hash=excluded.hash,salt=excluded.salt,updated=excluded.updated').bind(email,await derive(password,salt),hex(salt.buffer),Date.now()).run()}
export async function checkPassword(d:any,email:string,password:string){const row=await d.prepare('SELECT hash,salt FROM credentials WHERE email=?').bind(email).first();const h=await derive(password,row?unhex(row.salt):DUMMY_SALT);return !!row&&same(h,row.hash)}
export async function hasCredentials(d:any,email:string){return !!(await d.prepare('SELECT 1 AS x FROM credentials WHERE email=?').bind(email).first())}
type Kind='session'|'invite';
export async function newToken(d:any,email:string,kind:Kind){const token=randomHex(32);await d.batch([d.prepare('DELETE FROM tokens WHERE expires<?').bind(Date.now()),...(kind==='invite'?[d.prepare("DELETE FROM tokens WHERE email=? AND kind='invite'").bind(email)]:[]),d.prepare('INSERT INTO tokens (hash,email,kind,expires) VALUES (?,?,?,?)').bind(await sha(token),email,kind,Date.now()+(kind==='session'?SESSION_MS:INVITE_MS))]);return token}
export async function tokenEmail(d:any,token:string,kind:Kind):Promise<string|null>{if(!/^[0-9a-f]{64}$/.test(token))return null;const row=await d.prepare('SELECT email FROM tokens WHERE hash=? AND kind=? AND expires>?').bind(await sha(token),kind,Date.now()).first();return row?.email||null}
export async function dropTokens(d:any,email:string,kind?:Kind){await (kind?d.prepare('DELETE FROM tokens WHERE email=? AND kind=?').bind(email,kind):d.prepare('DELETE FROM tokens WHERE email=?').bind(email)).run()}
export async function dropToken(d:any,token:string){await d.prepare('DELETE FROM tokens WHERE hash=?').bind(await sha(token)).run()}
export const readCookie=(header:string|null)=>header?.split(';').map(c=>c.trim().split('=')).find(([k])=>k===COOKIE)?.[1]||''
export const sessionEmail=(d:any,header:string|null)=>tokenEmail(d,readCookie(header),'session');
export const cookie=(token:string|null,secure:boolean)=>`${COOKIE}=${token||''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token?SESSION_MS/1000:0}${secure?'; Secure':''}`;
// Limite de tentativas: janela fixa de 15 min por chave (e-mail, IP).
export async function throttle(d:any,key:string,max:number){const row=await d.prepare('SELECT count,reset FROM attempts WHERE key=?').bind(key).first();if(row&&row.reset>Date.now()&&row.count>=max)throw Error('Muitas tentativas. Aguarde alguns minutos.')}
export async function miss(d:any,key:string){const now=Date.now(),reset=now+15*60000;await d.prepare('INSERT INTO attempts (key,count,reset) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset<=? THEN 1 ELSE count+1 END,reset=CASE WHEN reset<=? THEN ? ELSE reset END').bind(key,reset,now,now,reset).run()}
export const hit=(d:any,key:string)=>d.prepare('DELETE FROM attempts WHERE key=?').bind(key).run();
export async function ensureStore(d:any){await d.prepare('INSERT OR IGNORE INTO store (id,version,data) VALUES (1,0,?)').bind(JSON.stringify(empty())).run()}
export async function hasUsers(d:any){const row=await d.prepare('SELECT data FROM store WHERE id=1').first();if(!row)return false;const p=JSON.parse(row.data);if(p.format!=='records-v2')return !!p.users?.length;return !!(await d.prepare("SELECT 1 AS x FROM records WHERE collection='users' LIMIT 1").first())}
export const setupToken=(given:unknown)=>{const want=(env as any).SETUP_TOKEN;return !!want&&same(String(given||''),String(want))};
export const setupConfigured=()=>!!(env as any).SETUP_TOKEN;
// E-mail é opcional: sem RESEND_API_KEY e MAIL_FROM o link é apenas copiado pelo administrador.
export async function sendMail(to:string,subject:string,text:string){if(!mailEnabled())throw Error('Envio de e-mail não configurado');const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+(env as any).RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:(env as any).MAIL_FROM,to:[to],subject,text})});if(!r.ok)throw Error('Não foi possível enviar o e-mail')}
