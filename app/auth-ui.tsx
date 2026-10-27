// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState,useEffect} from 'react';
import {createPortal} from 'react-dom';
import CreditFooter from './credits';
import {Wrench,Cpu,ShieldCheck,ClipboardList,Eye,EyeOff,ArrowRight,TriangleAlert,RefreshCw,KeyRound,LogOut,X,Copy,CheckCheck} from 'lucide-react';
const post=async(url:string,body:any)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d:any=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Não foi possível concluir');return d};
export async function logout(){try{await post('/api/auth/logout',{})}finally{location.href='/'}}
function Pass({label,value,onChange,autoComplete,hint,invalid}:any){
 const [show,setShow]=useState(false),id='f-'+label.replace(/\W/g,'');
 return <div className="authfield"><label htmlFor={id}>{label}</label><div className="authpass"><input id={id} type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} autoComplete={autoComplete} required minLength={10} maxLength={128} aria-invalid={invalid||undefined} aria-describedby={hint?id+'-hint':undefined}/><button type="button" onClick={()=>setShow(!show)} aria-pressed={show} aria-label={show?'Ocultar senha':'Mostrar senha'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{hint&&<small id={id+'-hint'}>{hint}</small>}</div>;
}
function Text({label,type='text',value,onChange,autoComplete,autoFocus,readOnly}:any){const id='f-'+label.replace(/\W/g,'');return <div className="authfield"><label htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={e=>onChange?.(e.target.value)} autoComplete={autoComplete} autoFocus={autoFocus} readOnly={readOnly} required/></div>}
const HINT='Mínimo de 10 caracteres. Prefira uma frase fácil de lembrar.';
// Tela de entrada: login, primeiro acesso (setup), definição de senha por convite e recuperação opcional por e-mail.
export function AuthGate({invite,onDone,notice}:{invite:string|null;onDone:()=>void;notice?:string}){
 const [mode,setMode]=useState<'login'|'setup'|'forgot'|'invite'>(invite?'invite':'login'),[info,setInfo]=useState({open:false,mail:false}),[email,setEmail]=useState(''),[name,setName]=useState(''),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(notice||''),[sent,setSent]=useState(false);
 useEffect(()=>{fetch('/api/auth/setup').then(r=>r.json() as Promise<any>).then(setInfo).catch(()=>{})},[]);
 useEffect(()=>{if(!invite)return;fetch('/api/auth/accept?token='+encodeURIComponent(invite)).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error);setEmail(d.email)}).catch(e=>setError(e.message))},[invite]);
 const mismatch=(mode==='invite'||mode==='setup')&&pw2!==''&&pw!==pw2;
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');
  if(mismatch){setError('As senhas não coincidem');return}
  setBusy(true);
  try{
   if(mode==='login')await post('/api/auth/login',{email,password:pw});
   else if(mode==='setup')await post('/api/auth/setup',{token:code,name,email,password:pw});
   else if(mode==='invite')await post('/api/auth/accept',{token:invite,password:pw});
   else{await post('/api/auth/forgot',{email});setSent(true);setBusy(false);return}
   if(invite)history.replaceState(null,'','/');
   onDone();
  }catch(err:any){setError(err.message);setBusy(false)}
 }
 const title={login:'Entrar na bancada',setup:'Configuração inicial',invite:'Defina sua senha',forgot:'Recuperar acesso'}[mode];
 const lead={login:'Use o e-mail cadastrado pela assistência.',setup:'Crie o primeiro administrador usando o código de configuração do servidor.',invite:email?'Você está definindo a senha de '+email+'.':'Confirmando seu convite…',forgot:'Enviaremos um link para definir uma nova senha.'}[mode];
 const label={login:'Entrar',setup:'Criar administrador',invite:'Salvar senha e entrar',forgot:'Enviar link'}[mode];
 return <><div className="authpage">
  <div className="authside">
   <div className="authlogo"><span className="brandicon"><Wrench size={21}/></span>bancada<span className="branddot">•</span></div>
   <h2>Assistência de mineradoras ASIC, do recebimento à entrega.</h2>
   <ul><li><Cpu size={18}/>Rastreie cada equipamento e componente</li><li><ClipboardList size={18}/>Diagnóstico, testes e orçamento por peça</li><li><ShieldCheck size={18}/>Cada pessoa vê só o que lhe cabe</li></ul>
  </div>
  <section className="authcard" aria-labelledby="auth-title">
   <div className="authlogo authlogo-mobile"><span className="brandicon"><Wrench size={21}/></span>bancada<span className="branddot">•</span></div>
   <h1 id="auth-title">{title}</h1><p className="authlead">{lead}</p>
   {sent?<div className="authok" role="status"><CheckCheck size={18}/>Se o e-mail estiver cadastrado, o link chegará em instantes.</div>:
   <form onSubmit={submit} noValidate={false}>
    {error&&<div role="alert" className="alert"><TriangleAlert size={17}/>{error}</div>}
    {mode==='setup'&&<Text label="Seu nome" value={name} onChange={setName} autoComplete="name" autoFocus/>}
    {mode!=='invite'&&<Text label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="username" autoFocus={mode!=='setup'}/>}
    {mode==='setup'&&<Text label="Código de configuração" value={code} onChange={setCode} autoComplete="off"/>}
    {mode!=='forgot'&&<Pass label={mode==='login'?'Senha':'Nova senha'} value={pw} onChange={setPw} autoComplete={mode==='login'?'current-password':'new-password'} hint={mode==='login'?undefined:HINT}/>}
    {(mode==='invite'||mode==='setup')&&<Pass label="Repita a senha" value={pw2} onChange={setPw2} autoComplete="new-password" invalid={mismatch} hint={mismatch?'As senhas não coincidem':undefined}/>}
    <button className="btn primary authsubmit" disabled={busy||(mode==='invite'&&!email)}>{busy?<><RefreshCw size={16} className="spin"/>Aguarde…</>:<>{label}<ArrowRight size={16}/></>}</button>
   </form>}
   <div className="authlinks">
    {mode==='login'&&info.mail&&<button type="button" onClick={()=>{setMode('forgot');setError('');setSent(false)}}>Esqueci minha senha</button>}
    {mode==='login'&&info.open&&<button type="button" onClick={()=>{setMode('setup');setError('')}}>Primeiro acesso do administrador</button>}
    {(mode==='forgot'||mode==='setup')&&<button type="button" onClick={()=>{setMode('login');setError('');setSent(false)}}>Voltar para o login</button>}
    {mode==='login'&&!info.mail&&<span>Esqueceu a senha? Peça um novo link ao administrador.</span>}
   </div>
  </section>
 </div><CreditFooter/></>;
}
// Minha conta (trocar senha e, para a equipe, o e-mail de acesso) e sair. Reutilizado no menu e no portal.
export function SessionActions({email='',canEmail=false}:{email?:string;canEmail?:boolean}){
 const [open,setOpen]=useState(false),[tab,setTab]=useState<'senha'|'email'>('senha'),[cur,setCur]=useState(''),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[mail,setMail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState('');
 const mismatch=pw2!==''&&pw!==pw2;
 const reset=()=>{setCur('');setPw('');setPw2('');setMail('');setError('');setOk('')};
 useEffect(()=>{const h=()=>{reset();setTab('senha');setOpen(true)};window.addEventListener('abrir-conta',h);return()=>window.removeEventListener('abrir-conta',h)},[]);
 async function savePass(e:React.FormEvent){e.preventDefault();if(mismatch){setError('As senhas não coincidem');return}setBusy(true);setError('');try{await post('/api/auth/password',{current:cur,next:pw});reset();setOk('Senha alterada. Outras sessões foram encerradas.')}catch(err:any){setError(err.message)}setBusy(false)}
 async function saveMail(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await post('/api/auth/email',{password:cur,email:mail});reset();setOk('E-mail alterado para '+r.email+'. Use o novo e-mail no próximo login.')}catch(err:any){setError(err.message)}setBusy(false)}
 return <>
  <button className="iconbtn" title="Minha conta" aria-label="Minha conta: trocar senha ou e-mail" onClick={()=>{reset();setTab('senha');setOpen(true)}}><KeyRound size={17}/></button>
  <button className="iconbtn" title="Sair" aria-label="Sair" onClick={logout}><LogOut size={17}/></button>
  {open&&createPortal(<div className="overlay" onClick={()=>setOpen(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="pw-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">CONTA</span><h2 id="pw-title">Minha conta</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>{setOpen(false);if(ok.startsWith('E-mail'))location.reload()}}><X/></button></div>
   {canEmail&&<div className="tabs" role="tablist"><button role="tab" aria-selected={tab==='senha'} className={tab==='senha'?'active':''} onClick={()=>{reset();setTab('senha')}}>Senha</button><button role="tab" aria-selected={tab==='email'} className={tab==='email'?'active':''} onClick={()=>{reset();setTab('email')}}>E-mail de acesso</button></div>}
   {ok?<div className="authform"><div className="authok" role="status"><CheckCheck size={18}/>{ok}</div>{ok.startsWith('E-mail')&&<button className="btn primary authsubmit" onClick={()=>location.reload()}>Concluir</button>}</div>:
   tab==='senha'?<form onSubmit={savePass} className="authform">
    {error&&<div role="alert" className="alert"><TriangleAlert size={17}/>{error}</div>}
    <Pass label="Senha atual" value={cur} onChange={setCur} autoComplete="current-password"/>
    <Pass label="Nova senha" value={pw} onChange={setPw} autoComplete="new-password" hint={HINT}/>
    <Pass label="Repita a nova senha" value={pw2} onChange={setPw2} autoComplete="new-password" invalid={mismatch} hint={mismatch?'As senhas não coincidem':undefined}/>
    <button className="btn primary authsubmit" disabled={busy}>{busy?'Salvando…':'Salvar senha'}</button>
   </form>:
   <form onSubmit={saveMail} className="authform">
    {error&&<div role="alert" className="alert"><TriangleAlert size={17}/>{error}</div>}
    <p className="muted">E-mail atual: <strong>{email}</strong></p>
    <Text label="Novo e-mail" type="email" value={mail} onChange={setMail} autoComplete="email" autoFocus/>
    <Pass label="Senha atual (para confirmar)" value={cur} onChange={setCur} autoComplete="current-password"/>
    <button className="btn primary authsubmit" disabled={busy}>{busy?'Salvando…':'Salvar e-mail'}</button>
   </form>}
  </section></div>,document.body)}
 </>;
}
// Administrador: gera o link (sempre) e, se houver e-mail configurado, oferece enviá-lo.
export function InviteButton({email,name}:{email:string;name:string}){
 const [link,setLink]=useState(''),[mail,setMail]=useState(false),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 async function gen(send=false){setBusy(true);setError('');try{const d=await post('/api/auth/invite',{email,send});setLink(d.link);setMail(d.mail);setSent(d.sent)}catch(e:any){setError(e.message)}setBusy(false)}
 const copy=()=>navigator.clipboard.writeText(link).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500)}).catch(()=>setError('Não foi possível copiar. Selecione e copie o link.'));
 return <>
  <button className="btn" disabled={busy} onClick={()=>gen()}><KeyRound size={15}/>Link de senha</button>
  {link&&createPortal(<div className="overlay" onClick={()=>setLink('')}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="inv-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">ACESSO</span><h2 id="inv-title">Link para {name}</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>setLink('')}><X/></button></div>
   {error&&<div role="alert" className="alert"><TriangleAlert size={17}/>{error}</div>}
   <p className="muted">Envie este link à pessoa por um canal seguro. Ele vale por 72 horas e define (ou redefine) a senha de {email}.</p>
   <div className="authfield"><label htmlFor="inv-link">Link</label><input id="inv-link" readOnly value={link} onFocus={e=>e.currentTarget.select()}/></div>
   <div className="formfoot"><button className="btn primary" onClick={copy}><Copy size={15}/>{copied?'Copiado':'Copiar link'}</button>{mail&&<button className="btn" disabled={busy||sent} onClick={()=>gen(true)}>{sent?'E-mail enviado':'Enviar por e-mail'}</button>}</div>
  </section></div>,document.body)}
 </>;
}
