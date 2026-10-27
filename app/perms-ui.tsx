// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState} from 'react';
import {createPortal} from 'react-dom';
import {ShieldCheck,X,Save,RotateCcw,TriangleAlert} from 'lucide-react';
import {PERMS,DEFAULTS,can} from '../lib/perms.mjs';
// Permissões por usuário (administração): o perfil define o padrão e cada item pode ser liberado ou bloqueado.
export default function PermsButton({u,act}:{u:any;act:Function}){
 const [open,setOpen]=useState(false),[sel,setSel]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState(false);
 const custom=Object.keys(u.perms||{}).length,def=(DEFAULTS as any)[u.role];
 const start=()=>{setSel(Object.fromEntries(PERMS.map(([k]:any)=>[k,can(u,k)])));setOpen(true)};
 async function save(perms:Record<string,boolean>){setBusy(true);const ok=await act('asic_user_perms',{user:u.id,perms},false);setBusy(false);if(ok)setOpen(false)}
 const changed=PERMS.filter(([k]:any)=>sel[k]!==def[k]).length;
 return <>
  <button className="btn" onClick={start}><ShieldCheck size={15}/>Permissões{custom>0&&<span className="badge blue" style={{marginLeft:6}}>personalizado</span>}</button>
  {open&&createPortal(<div className="overlay" onClick={()=>setOpen(false)}><section className="modal permmodal" role="dialog" aria-modal="true" aria-labelledby="pm-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">PERMISSÕES · {u.role.toUpperCase()}</span><h2 id="pm-title">{u.name}</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>setOpen(false)}><X/></button></div>
   <p className="muted">O perfil de <strong>{u.role}</strong> define o padrão. Marque o que esta pessoa pode fazer; o que você mudar fica destacado.</p>
   <ul className="permlist">{PERMS.map(([k,label,desc]:any)=><li key={k} className={sel[k]!==def[k]?'changed':''}><label className="checkline"><input type="checkbox" checked={!!sel[k]} onChange={e=>setSel({...sel,[k]:e.target.checked})}/><span><strong>{label}</strong><small>{desc}</small><small className="permdef">Padrão do perfil: {def[k]?'permitido':'bloqueado'}{sel[k]!==def[k]?' · alterado':''}</small></span></label></li>)}</ul>
   <p className="muted"><TriangleAlert size={14} style={{verticalAlign:'-2px'}}/> Administrador sempre tem tudo. Trocar o perfil da pessoa restaura o padrão do novo perfil.</p>
   <div className="formfoot"><button className="btn" disabled={busy||!custom&&!changed} onClick={()=>save({})}><RotateCcw size={15}/>Restaurar padrão do perfil</button><button className="btn primary" disabled={busy} onClick={()=>save(sel)}><Save size={15}/>{busy?'Salvando…':'Salvar permissões'}</button></div>
  </section></div>,document.body)}
 </>;
}
