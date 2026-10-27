// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState,useEffect} from 'react';
import {Wrench,Lock,Copy,RefreshCw,TriangleAlert,CheckCheck,LogOut,ArrowRight,Send} from 'lucide-react';
import {PhotoPicker,shrink} from './photos-ui';
import CreditFooter from './credits';
const fmt=(v:string|null)=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('pt-BR'):'—';
const when=(v:string)=>new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
export const fmtCode=(v:string)=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12).replace(/(.{4})(?=.)/g,'$1-');
function Table({label,head,rows,empty}:{label:string;head:string[];rows:React.ReactNode[][];empty:string}){
 return <div className="tablewrap"><table aria-label={label}><thead><tr>{head.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="panelempty">{empty}</p>}</div>;
}
const KEY='painel-code';
// "Manter neste aparelho": guarda o código no aparelho (localStorage); sem isso, só enquanto a aba estiver aberta.
const remember=(code:string|null,keep=true)=>{try{localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);if(code)(keep?localStorage:sessionStorage).setItem(KEY,code)}catch{}};
const saved=()=>{try{return localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||''}catch{return ''}};
const QUICK=['Qual é a previsão de entrega?','Preciso falar com um atendente.','Posso retirar o equipamento hoje?','Enviei novas fotos do equipamento.','Preciso do orçamento atualizado.','Obrigado, estou ciente.'];
const pad=(n:any)=>'OS-'+String(n).padStart(4,'0');
// Fala com a assistência: mensagem, respostas rápidas e fotos, sempre vinculadas a uma OS aberta.
function Contact({d,code,refresh}:any){
 const open=d.orders.filter((o:any)=>o.open),[order,setOrder]=useState(String(open[0]?.number??'')),[text,setText]=useState(''),[photos,setPhotos]=useState<File[]>([]),[busy,setBusy]=useState(false),[done,setDone]=useState(''),[err,setErr]=useState('');
 const cur=d.orders.find((o:any)=>String(o.number)===order);
 async function send(e:React.FormEvent){
  e.preventDefault();setErr('');setDone('');
  if(!order){setErr('Escolha a OS.');return}if(!text.trim()&&!photos.length){setErr('Escreva uma mensagem ou escolha fotos.');return}
  setBusy(true);const failed:string[]=[];
  try{
   if(text.trim()){const r=await fetch('/api/painel/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,order,text})});const j:any=await r.json();if(!r.ok)throw Error(j.error)}
   for(const p of photos){try{const f=new FormData();f.set('code',code);f.set('order',order);f.set('file',await shrink(p));const r=await fetch('/api/painel/photo',{method:'POST',body:f});if(!r.ok)throw Error(((await r.json()) as any).error)}catch(x:any){failed.push(p.name+(x.message?' ('+x.message+')':''))}}
   setText('');setPhotos([]);setDone(failed.length?'Mensagem enviada, mas estas fotos falharam: '+failed.join(', '):'Enviado. A assistência recebeu na '+pad(order)+'.');await refresh();
  }catch(x:any){setErr(x.message)}
  setBusy(false);
 }
 return <section className="card panelsection contact" aria-labelledby="ct-title"><div className="sectionhead"><h2 id="ct-title">Falar com a assistência</h2></div>
  {!open.length?<p className="panelempty">Você não tem OS aberta no momento. Quando houver, poderá enviar mensagens e fotos por aqui.</p>:
  <form onSubmit={send} className="contactform">
   <label className="field"><span>Sobre qual OS?</span><select value={order} onChange={e=>setOrder(e.target.value)}>{open.map((o:any)=><option key={o.number} value={o.number}>{o.code} · {o.assets.join(', ')||'sem equipamento'} · {o.status}</option>)}</select></label>
   <div className="chips" role="group" aria-label="Respostas rápidas">{QUICK.map(q=><button type="button" className="chip" key={q} onClick={()=>setText(text?text+' '+q:q)}>{q}</button>)}</div>
   <label className="field"><span>Mensagem</span><textarea rows={3} maxLength={1000} value={text} onChange={e=>setText(e.target.value)} placeholder="Escolha uma resposta rápida acima ou escreva aqui"/></label>
   <PhotoPicker files={photos} setFiles={setPhotos} disabled={busy} label="Fotos (opcional)"/>
   {err&&<div role="alert" className="alert"><TriangleAlert size={17}/>{err}</div>}{done&&<div role="status" className="authok"><CheckCheck size={18}/>{done}</div>}
   <button className="btn primary" disabled={busy||(!text.trim()&&!photos.length)}>{busy?<><RefreshCw size={15} className="spin"/>Enviando…</>:<><Send size={15}/>Enviar para a {pad(order)}</>}</button>
  </form>}
  {cur&&cur.comments.length>0&&<div className="conversation"><h3>Conversa da {cur.code}</h3><ul aria-label={'Mensagens da '+cur.code}>{cur.comments.map((c:any,i:number)=><li key={i} className={c.fromClient?'mine':''}><span className="muted">{c.fromClient?'Você':'Assistência'} · {when(c.at)}</span><p>{c.text}</p></li>)}</ul></div>}
 </section>;
}
// Painel público do cliente (versão paga): entra pelo código (digitado em /painel ou vindo no link), somente leitura.
export function ClientPanel({initial}:{initial:string}){
 const [d,setD]=useState<any>(null),[code,setCode]=useState(''),[input,setInput]=useState(fmtCode(initial)),[error,setError]=useState(''),[busy,setBusy]=useState(false),[keep,setKeep]=useState(true);
 async function open(raw:string){
  setBusy(true);setError('');
  try{const r=await fetch('/api/painel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:raw})});const j:any=await r.json();if(!r.ok){if(r.status===404)remember(null);throw Error(j.error)}setD(j);setCode(raw);remember(raw,keep)}
  catch(e:any){setError(e.message);setD(null)}
  setBusy(false);
 }
 useEffect(()=>{const c=initial||saved();if(c){setInput(fmtCode(c));open(c)}},[]);
 const leave=()=>{remember(null);setD(null);setCode('');setInput('');setError('')};
 if(!d)return <><div className="panelentry"><form className="authcard" onSubmit={e=>{e.preventDefault();open(input)}} aria-labelledby="pe-title">
  <div className="authlogo authlogo-mobile" style={{display:'flex'}}><span className="brandicon"><Wrench size={21}/></span>bancada<span className="branddot">•</span></div>
  <h1 id="pe-title">Painel do cliente</h1><p className="authlead">Digite o código que a assistência enviou para acompanhar seus equipamentos e ordens de serviço.</p>
  {error&&<div role="alert" className="alert"><TriangleAlert size={17}/>{error}</div>}
  <div className="authfield"><label htmlFor="pe-code">Código de acesso</label><input id="pe-code" className="codeinput" value={input} onChange={e=>setInput(fmtCode(e.target.value))} placeholder="XXXX-XXXX-XXXX" autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} autoFocus required maxLength={14} aria-describedby="pe-hint"/><small id="pe-hint">12 letras e números, com ou sem traços.</small></div>
  <label className="checkline"><input type="checkbox" checked={keep} onChange={e=>setKeep(e.target.checked)}/><span>Manter neste aparelho <small>(não preciso digitar o código de novo; use “Sair” em aparelho compartilhado)</small></span></label>
  <button className="btn primary authsubmit" disabled={busy||input.replace(/-/g,'').length<12}>{busy?<><RefreshCw size={16} className="spin"/>Verificando…</>:<>Acessar painel<ArrowRight size={16}/></>}</button>
 </form></div><CreditFooter/></>;
 const s=d.summary;
 return <><div className="panelpage">
  <div className="panelbar"><div className="panelbrand"><span className="brandicon"><Wrench size={21}/></span>{d.company||'bancada'}</div><div className="panelupdated"><span>Atualizado em {when(d.updated)}</span><button className="btn" onClick={()=>open(code)} disabled={busy} aria-label="Atualizar painel"><RefreshCw size={15} className={busy?'spin':''}/>Atualizar</button><button className="btn" onClick={leave} aria-label="Sair do painel"><LogOut size={15}/>Sair</button></div></div>
  <h1>Painel de {d.client}</h1><p className="panelsub">Acompanhe seus equipamentos e ordens de serviço e fale com a assistência por aqui.</p>
  <section className="metrics" aria-label="Resumo">{[['OS em andamento',s.open],['Prontas para retirada',s.ready],['Aguardando sua decisão',s.awaiting],['Equipamentos',s.equipment]].map(([l,v])=><article className="metric" key={String(l)}><p className="muted">{l}</p><div className="metricvalue">{v}</div></article>)}</section>
  <Contact d={d} code={code} refresh={()=>open(code)}/>
  <section className="card panelsection"><div className="sectionhead"><h2>Ordens de serviço</h2></div><Table label="Ordens de serviço" head={['OS','EQUIPAMENTOS','ETAPA','PREVISÃO','RECADO DA ASSISTÊNCIA']} empty="Nenhuma ordem de serviço ainda." rows={d.orders.map((o:any)=>[<strong className="oscode">{o.code}</strong>,o.assets.join(', ')||'—',<span className="badge blue"><i/>{o.status}</span>,o.delivered?'Entregue em '+fmt(o.delivered):fmt(o.due),<>{o.note||'—'}{o.intake&&!o.intake.complete&&<span className="sub">Recebida incompleta: {[...o.intake.missing,o.intake.note].filter(Boolean).join(', ')}</span>}{o.pendingDecisions>0&&<span className="sub danger">{o.pendingDecisions} item(ns) aguardando sua aprovação</span>}</>])}/></section>
  <section className="card panelsection"><div className="sectionhead"><h2>Equipamentos</h2></div><Table label="Equipamentos" head={['CÓDIGO','TIPO / MODELO','SÉRIE','ESTADO','LOCAL']} empty="Nenhum equipamento cadastrado." rows={d.assets.map((a:any)=>[<strong className="oscode">{a.code}</strong>,a.kind+' · '+a.model+(a.revision?' ('+a.revision+')':''),a.serial,a.status,a.location||'—'])}/></section>
  {(d.lots.length>0||d.shipments.length>0)&&<section className="card panelsection"><div className="sectionhead"><h2>Lotes e devoluções</h2></div>
   <Table label="Lotes" head={['LOTE','REMESSA','RECEBIDO','CONFERÊNCIA','SITUAÇÃO']} empty="" rows={d.lots.map((l:any)=>[<strong className="oscode">{l.code}</strong>,l.name,fmt(l.received),l.counted+'/'+l.expected,l.closed?'Encerrado':'Aberto'])}/>
   {d.shipments.length>0&&<Table label="Devoluções" head={['LOTE','UNIDADES','TRANSPORTADORA','RASTREAMENTO','SITUAÇÃO']} empty="" rows={d.shipments.map((x:any)=>[x.lot,x.units,x.carrier,x.tracking||'—',x.status])}/>}</section>}
 </div><CreditFooter/></>;
}
// Controle do painel de um cliente: liga/desliga (o código fica guardado), copia código/link e gera código novo.
export function PanelControl({client,plan,admin,act}:{client:any;plan:boolean;admin:boolean;act:Function}){
 const [copied,setCopied]=useState('');
 if(!plan)return <div className="panelbox locked"><Lock size={18}/><div><strong>Painel do cliente</strong><p className="muted">Recurso da versão paga. Quando disponível, cada cliente pode ter um código de acesso próprio.</p></div></div>;
 const enabled=client.panelEnabled===true,code=client.panelCode?fmtCode(client.panelCode):'',link=client.panelCode?location.origin+'/?painel='+client.panelCode:'';
 const copy=(what:string,text:string)=>navigator.clipboard.writeText(text).then(()=>{setCopied(what);setTimeout(()=>setCopied(''),2500)}).catch(()=>{});
 const toggle=()=>{if(enabled&&!confirm('Desativar o painel? O cliente perde o acesso agora. O código fica guardado e volta a valer se você reativar.'))return;act('asic_panel',{client:client.id,enabled:!enabled})};
 return <div className="panelbox">
  <div className="switchrow"><div><strong id={'sw-'+client.id}>Painel do cliente</strong><p className="muted">O cliente acompanha OS e equipamentos em <b>/painel</b>, só leitura. Nem todo cliente precisa ter.</p></div>
   <button type="button" role="switch" aria-checked={enabled} aria-labelledby={'sw-'+client.id} className={'switch'+(enabled?' on':'')} disabled={!admin} onClick={toggle}><i/><span className="sr">{enabled?'Ativado':'Desativado'}</span></button></div>
  <p className="switchstate"><span className={'badge '+(enabled?'green':'gray')}><i/>{enabled?'Ativado':'Desativado'}</span>{!admin&&<span className="muted"> Somente administradores ativam ou desativam.</span>}</p>
  {code&&<div className="codebox"><span className="muted">Código de acesso{enabled?'':' (guardado, sem efeito enquanto desativado)'}</span><code aria-label={'Código '+code.split('').join(' ')}>{code}</code>
   <div className="panelactions"><button className="btn" onClick={()=>copy('code',code)}>{copied==='code'?<CheckCheck size={14}/>:<Copy size={14}/>}{copied==='code'?'Copiado':'Copiar código'}</button><button className="btn" onClick={()=>copy('link',link)}>{copied==='link'?<CheckCheck size={14}/>:<Copy size={14}/>}{copied==='link'?'Copiado':'Copiar link'}</button>{admin&&<button className="btn" onClick={()=>{if(confirm('Gerar um código novo? O atual deixa de funcionar.'))act('asic_panel',{client:client.id,regenerate:true})}}><RefreshCw size={14}/>Novo código</button>}</div></div>}
 </div>;
}
