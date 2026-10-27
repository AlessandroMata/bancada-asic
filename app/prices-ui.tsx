// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState} from 'react';
import {Search,Plus,X,Pencil,Save,Tag} from 'lucide-react';
const brl=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const Fld=({label,...rest}:any)=><label className="field"><span>{label}</span><input {...rest}/></label>;
// Tabela de preços: itens (serviços e peças) usados nos orçamentos. Só o administrador altera; o preço vale no momento do orçamento.
export default function PriceTable({data,user,act,admin}:any){
 const items=data.priceItems||[],[search,setSearch]=useState(''),[cat,setCat]=useState(''),[edit,setEdit]=useState<any>(null),[busy,setBusy]=useState(false);
 const shown=items.filter((p:any)=>(!cat||p.category===cat)&&[p.name,p.models].join(' ').toLowerCase().includes(search.toLowerCase()));
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f:any=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);const ok=await act(edit.id?'asic_price_update':'asic_price',edit.id?{...f,item:edit.id,active:f.active==='Sim'}:f,false);setBusy(false);if(ok)setEdit(null)}
 return <>
  <section className="card"><div className="sectionhead"><h2>Itens da tabela <span className="count">{items.length}</span></h2>
   <div className="toolbarinline"><div className="search"><Search size={16}/><input aria-label="Buscar item" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Descrição ou modelo"/></div>
   <select aria-label="Filtrar por categoria" value={cat} onChange={e=>setCat(e.target.value)}><option value="">Todas as categorias</option><option>Serviço</option><option>Peça</option></select>
   {admin&&<button className="btn primary" data-new="Novo item" onClick={()=>setEdit({})}><Plus size={15}/>Novo item</button>}</div></div>
   <div className="tablewrap"><table><thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>PREÇO</th>{user.can?.verCustos&&<th>CUSTO</th>}<th>GARANTIA</th><th>MODELOS</th><th>SITUAÇÃO</th>{admin&&<th/>}</tr></thead><tbody>
    {shown.map((p:any)=><tr key={p.id} className={p.active===false?'dim':''}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{brl(p.price)}</td>{user.can?.verCustos&&<td>{brl(p.cost)}</td>}<td>{p.warranty} dias</td><td>{p.models||'Todos'}</td><td><span className={'badge '+(p.active===false?'gray':'green')}><i/>{p.active===false?'Desativado':'Ativo'}</span></td>{admin&&<td><button className="iconbtn" aria-label={'Editar '+p.name} onClick={()=>setEdit(p)}><Pencil size={16}/></button></td>}</tr>)}
   </tbody></table>
   {!items.length&&<div className="empty"><Tag size={32}/><h3>Sua tabela de preços está vazia</h3><p>{admin?'Cadastre os serviços e peças mais usados. O técnico escolherá daqui nos orçamentos, com o preço já preenchido.':'Peça ao administrador para cadastrar os itens.'}</p></div>}
   {items.length>0&&!shown.length&&<p className="panelempty">Nenhum item encontrado.</p>}</div></section>
  {edit&&<div className="overlay" onClick={()=>setEdit(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="pt-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">TABELA DE PREÇOS</span><h2 id="pt-title">{edit.id?'Editar item':'Novo item'}</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>setEdit(null)}><X/></button></div>
   <form className="formgrid" onSubmit={save} key={edit.id||'novo'}>
    <Fld label="Descrição *" name="name" defaultValue={edit.name||''} required maxLength={200}/>
    <label className="field"><span>Categoria *</span><select name="category" defaultValue={edit.category||'Serviço'} required><option>Serviço</option><option>Peça</option></select></label>
    <Fld label="Preço (R$) *" name="price" type="number" min="0" step="0.01" defaultValue={edit.price??''} required/>
    <Fld label="Custo interno (R$)" name="cost" type="number" min="0" step="0.01" defaultValue={edit.cost??0}/>
    <Fld label="Garantia (dias)" name="warranty" type="number" min="0" step="1" defaultValue={edit.warranty??0}/>
    <Fld label="Modelos compatíveis (opcional)" name="models" defaultValue={edit.models||''} placeholder="Ex.: S19, S19j Pro"/>
    {edit.id&&<label className="field full"><span>Situação</span><select name="active" defaultValue={edit.active===false?'Não':'Sim'}><option value="Sim">Ativo — aparece nos orçamentos</option><option value="Não">Desativado — some dos orçamentos novos</option></select></label>}
    <p className="full muted">Alterar o preço não muda orçamentos já feitos; vale para os próximos.</p>
    <div className="formfoot"><button className="btn primary" disabled={busy}><Save size={15}/>{busy?'Salvando…':'Salvar item'}</button></div>
   </form></section></div>}
 </>;
}
