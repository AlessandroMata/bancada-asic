// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState} from 'react';
import {Search,ChevronRight,X,Users,Save} from 'lucide-react';
import {PanelControl} from './panel-ui';
const date=(v:string)=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('pt-BR'):'—';
const oscode=(o:any)=>'OS-'+String(o.number).padStart(4,'0');
const TABS=['Dados','Equipamentos','Ordens','Acesso e painel'];
const Fld=({label,...rest}:any)=><label className="field"><span>{label}</span><input {...rest}/></label>;
// Gerenciar clientes: lista com busca e, ao abrir, dados editáveis, equipamentos, OS, usuários do portal e painel.
export default function ClientManager({data,user,act,plan,admin}:any){
 const [search,setSearch]=useState(''),[openId,setOpen]=useState(''),[tab,setTab]=useState('Dados'),[busy,setBusy]=useState(false);
 const {clients,orders}=data,assets=data.assets||[],users=data.users||[],canEdit=!!user.can?.gerenciarClientes;
 const c=clients.find((x:any)=>x.id===openId);
 const term=search.toLowerCase(),shown=clients.filter((x:any)=>[x.name,x.phone,x.email,x.document].join(' ').toLowerCase().includes(term));
 const mine=(x:any)=>({a:assets.filter((e:any)=>e.client===x.id),o:orders.filter((r:any)=>r.client===x.id)});
 const active=(list:any[])=>list.filter(r=>!['Entregue','Cancelado'].includes(r.status)).length;
 const badge=(x:any)=>!plan?'—':<span className={'badge '+(x.panelEnabled?'green':'gray')}><i/>{x.panelEnabled?'Ativado':'Desativado'}</span>;
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);await act('asic_client_update',{client:c.id,...f},false);setBusy(false)}
 return <>
  <section className="card"><div className="sectionhead"><h2>Seus clientes <span className="count">{clients.length}</span></h2><div className="search"><Search size={16}/><input aria-label="Buscar cliente" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, telefone, e-mail ou documento"/></div></div>
   <div className="tablewrap"><table><thead><tr><th>CLIENTE</th><th>WHATSAPP</th><th>DOCUMENTO</th><th>EQUIPAMENTOS</th><th>OS ABERTAS</th>{plan&&<th>PAINEL</th>}<th/></tr></thead><tbody>
    {shown.map((x:any)=>{const m=mine(x);return <tr key={x.id} onClick={()=>{setOpen(x.id);setTab('Dados')}} className="clickrow"><td><button className="linkbtn" onClick={e=>{e.stopPropagation();setOpen(x.id);setTab('Dados')}}><strong>{x.name}</strong></button><span className="sub">{x.email||'E-mail não informado'}</span></td><td>{x.phone}</td><td>{x.document||'—'}</td><td>{m.a.length}</td><td>{active(m.o)}</td>{plan&&<td>{badge(x)}</td>}<td><ChevronRight size={16}/></td></tr>})}
   </tbody></table>
   {!clients.length&&<div className="empty"><Users size={32}/><h3>Seu primeiro cliente está por vir</h3><p>Comece cadastrando quem confia na sua assistência.</p></div>}
   {clients.length>0&&!shown.length&&<p className="panelempty">Nenhum cliente encontrado para “{search}”.</p>}
   </div></section>
  {c&&(()=>{const m=mine(c),portal=users.filter((u:any)=>u.role==='Cliente'&&u.client===c.id);return <div className="overlay" onClick={()=>setOpen('')}><section className="modal wide" role="dialog" aria-modal="true" aria-labelledby="cm-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">GERENCIAR CLIENTE</span><h2 id="cm-title">{c.name}</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>setOpen('')}><X/></button></div>
   <div className="tabs" role="tablist">{TABS.map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
   {tab==='Dados'&&<form className="formgrid" onSubmit={save} key={c.id+c.name+c.phone+c.email+c.document}>
    <Fld label="Nome *" name="name" defaultValue={c.name} required disabled={!canEdit}/><Fld label="Telefone / WhatsApp *" name="phone" type="tel" defaultValue={c.phone} required disabled={!canEdit}/>
    <Fld label="E-mail" name="email" type="email" defaultValue={c.email||''} disabled={!canEdit}/><Fld label="CPF / CNPJ" name="document" defaultValue={c.document||''} disabled={!canEdit}/>
    <div className="formfoot">{canEdit?<button className="btn primary" disabled={busy}><Save size={15}/>{busy?'Salvando…':'Salvar alterações'}</button>:<span className="muted">Seu perfil só consulta os dados.</span>}</div></form>}
   {tab==='Equipamentos'&&<div className="tablewrap"><table aria-label="Equipamentos do cliente"><thead><tr><th>CÓDIGO</th><th>TIPO / MODELO</th><th>SÉRIE</th><th>ESTADO</th><th>LOCAL</th></tr></thead><tbody>{m.a.map((e:any)=><tr key={e.id}><td><strong className="oscode">{e.code}</strong></td><td>{e.kind} · {e.model}{e.revision?' ('+e.revision+')':''}</td><td>{e.serial}</td><td>{e.status}</td><td>{e.location||'—'}</td></tr>)}</tbody></table>{!m.a.length&&<p className="panelempty">Nenhum equipamento deste cliente ainda.</p>}</div>}
   {tab==='Ordens'&&<div className="tablewrap"><table aria-label="Ordens do cliente"><thead><tr><th>OS</th><th>ETAPA</th><th>DEFEITO</th><th>ENTRADA</th><th>PREVISÃO</th></tr></thead><tbody>{[...m.o].reverse().map((o:any)=><tr key={o.id}><td><strong className="oscode">{oscode(o)}</strong></td><td>{o.status}</td><td>{o.issue}</td><td>{date(o.created)}</td><td>{date(o.due)}</td></tr>)}</tbody></table>{!m.o.length&&<p className="panelempty">Nenhuma ordem de serviço deste cliente ainda.</p>}</div>}
   {tab==='Acesso e painel'&&<><PanelControl client={c} plan={plan} admin={admin} act={act}/>
    <h3 className="spaced">Usuários do portal</h3>
    {portal.length?<div className="tablewrap"><table aria-label="Usuários do portal"><thead><tr><th>NOME</th><th>E-MAIL</th><th>APROVAÇÃO</th></tr></thead><tbody>{portal.map((u:any)=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.canApprove?'Pode aprovar, conforme contrato':'Somente consulta'}</td></tr>)}</tbody></table></div>:<p className="muted">Nenhum usuário do portal para este cliente. Cadastre em “Contratos e campo → Acesso ao portal”, mais abaixo nesta página.</p>}</>}
  </section></div>})()}
 </>;
}
