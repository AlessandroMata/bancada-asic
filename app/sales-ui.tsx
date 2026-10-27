// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState} from 'react';
import {Search,Plus,X,Save,Pencil,Trash2,HandCoins,Banknote,Ban,ShoppingCart,Tag} from 'lucide-react';
const brl=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const dateBR=(v:string)=>new Date(v).toLocaleDateString('pt-BR');
const CONDITIONS=['Nova','Usada testada','Recondicionada','Para peças'],METHODS=['Pix','Dinheiro','Cartão','Transferência','Boleto'];
const Fld=({label,...rest}:any)=><label className="field"><span>{label}</span><input {...rest}/></label>;
const Sel=({label,options,...rest}:any)=><label className="field"><span>{label}</span><select {...rest}>{options.map((o:string)=><option key={o}>{o}</option>)}</select></label>;
// Vendas: máquinas do estoque próprio para venda, venda de peças do estoque e o registro das vendas. Fora do portal do cliente; custo só com a permissão "Ver custos".
export default function SalesPage({data,user,act,admin}:any){
 const machines=data.saleMachines||[],sales=data.sales||[],parts=data.parts||[],clients=data.clients||[],costs=!!user.can?.verCustos;
 const [tab,setTab]=useState('Máquinas para venda'),[search,setSearch]=useState(''),[modal,setModal]=useState<any>(null),[busy,setBusy]=useState(false);
 const byId=(id:string)=>machines.find((m:any)=>m.id===id),item=(v:any)=>v.kind==='Peça'?{name:(parts.find((x:any)=>x.id===v.part)?.name||'Peça')+' × '+v.qty,sub:'Peça'}:{name:byId(v.machine)?.model||'Máquina',sub:(byId(v.machine)?.code||'')+' · '+(byId(v.machine)?.serial||'')},clientName=(v:any)=>clients.find((c:any)=>c.id===v.client)?.name||v.buyer||'—';
 const available=machines.filter((m:any)=>m.status==='Disponível'),done=sales.filter((v:any)=>v.status==='Concluída');
 const shownM=machines.filter((m:any)=>[m.code,m.model,m.brand,m.serial,m.origin].join(' ').toLowerCase().includes(search.toLowerCase()));
 const shownS=sales.filter((v:any)=>[item(v).name,item(v).sub,clientName(v)].join(' ').toLowerCase().includes(search.toLowerCase())).slice().reverse();
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f:any=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);const ok=await act(modal.action,{...f,...modal.extra},false);setBusy(false);if(ok)setModal(null)}
 const cancel=async(v:any)=>{const reason=window.prompt('Motivo do cancelamento da venda #'+v.number);if(reason!==null)await act('asic_sale_cancel',{sale:v.id,reason},false)};
 const remove=async(m:any)=>{if(window.confirm('Remover '+m.code+' do estoque de venda?'))await act('asic_sale_machine_remove',{machine:m.id},false)};
 const machineForm=(m:any)=><>
  <Fld label="Modelo *" name="model" defaultValue={m.model||''} required maxLength={120}/><Fld label="Marca" name="brand" defaultValue={m.brand||''} maxLength={80}/>
  <Fld label="Revisão" name="revision" defaultValue={m.revision||''} maxLength={60}/><Fld label="Número de série *" name="serial" defaultValue={m.serial||''} required maxLength={64}/>
  <Sel label="Condição *" name="condition" options={CONDITIONS} defaultValue={m.condition||'Recondicionada'}/><Fld label="Hashrate (TH/s)" name="hashrate" type="number" min="0" step="0.01" defaultValue={m.hashrate??''}/>
  <Fld label="Origem *" name="origin" defaultValue={m.origin||''} required placeholder="Ex.: compra de sucata, recuperada em OS, consignação" maxLength={200}/>
  <Fld label="Preço de venda (R$) *" name="price" type="number" min="0" step="0.01" defaultValue={m.price??''} required/>
  {costs&&<Fld label="Custo (R$)" name="cost" type="number" min="0" step="0.01" defaultValue={m.cost??0}/>}
  <label className="field full"><span>Observações</span><textarea name="notes" defaultValue={m.notes||''} rows={2} maxLength={2000}/></label></>;
 return <>
  <section className="metrics">{[[ShoppingCart,'Disponíveis para venda',available.length,'No estoque de venda','blue'],[Tag,'Valor em estoque',brl(available.reduce((v:number,m:any)=>v+m.price,0)),'Preço de venda somado','purple'],[HandCoins,'Vendas concluídas',done.length,brl(done.reduce((v:number,x:any)=>v+x.price,0))+' vendidos','green'],[Banknote,'A receber',brl(done.reduce((v:number,x:any)=>v+x.price-x.paid,0)),'Saldo das vendas','red']].map(([Icon,label,value,note,c]:any)=><article className="metric" key={label}><div className="metriclabel">{label}<span className={'metricicon '+c}><Icon size={18}/></span></div><div className="metricvalue">{value}</div><small>{note}</small></article>)}</section>
  <section className="card"><div className="sectionhead"><h2>{tab} <span className="count">{tab==='Vendas'?sales.length:machines.length}</span></h2>
   <div className="toolbarinline"><div className="tabs" role="tablist">{['Máquinas para venda','Vendas'].map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
   <div className="search"><Search size={16}/><input aria-label="Buscar" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Modelo, série ou comprador"/></div>
   <button className="btn" onClick={()=>setModal({title:'Vender peça',action:'asic_sale',form:<PartSaleForm parts={parts} clients={clients}/>})}><HandCoins size={15}/>Vender peça</button>
   {tab==='Máquinas para venda'&&<button className="btn primary" onClick={()=>setModal({title:'Nova máquina para venda',action:'asic_sale_machine',form:machineForm({})})}><Plus size={15}/>Nova máquina</button>}</div></div>
   {tab==='Máquinas para venda'?<div className="tablewrap"><table><thead><tr><th>CÓDIGO</th><th>MÁQUINA</th><th>SÉRIE</th><th>CONDIÇÃO</th><th>ORIGEM</th><th>PREÇO</th>{costs&&<th>CUSTO</th>}<th>SITUAÇÃO</th><th/></tr></thead><tbody>
    {shownM.map((m:any)=><tr key={m.id} className={m.status==='Vendida'?'dim':''}><td>{m.code}</td><td><strong>{m.model}</strong><br/><small>{[m.brand,m.hashrate?m.hashrate+' TH/s':''].filter(Boolean).join(' · ')}</small></td><td>{m.serial}</td><td>{m.condition}</td><td>{m.origin}</td><td>{brl(m.price)}</td>{costs&&<td>{brl(m.cost)}</td>}
     <td><span className={'badge '+(m.status==='Vendida'?'gray':'green')}><i/>{m.status}</span></td>
     <td className="rowactions">{m.status==='Disponível'&&<><button className="iconbtn" title="Vender" aria-label={'Vender '+m.code} onClick={()=>setModal({title:'Vender '+m.code,action:'asic_sale',extra:{machine:m.id},form:<SaleForm m={m} clients={clients}/>})}><HandCoins size={15}/></button>
      <button className="iconbtn" title="Editar" aria-label={'Editar '+m.code} onClick={()=>setModal({title:'Editar '+m.code,action:'asic_sale_machine_edit',extra:{machine:m.id},form:machineForm(m)})}><Pencil size={15}/></button>
      <button className="iconbtn" title="Remover" aria-label={'Remover '+m.code} onClick={()=>remove(m)}><Trash2 size={15}/></button></>}</td></tr>)}
   </tbody></table>
   {!machines.length&&<div className="empty"><ShoppingCart size={32}/><h3>Nenhuma máquina para venda</h3><p>Cadastre as máquinas que você quer revender. Elas ficam separadas das máquinas dos clientes.</p></div>}
   {machines.length>0&&!shownM.length&&<p className="panelempty">Nada encontrado.</p>}</div>
   :<div className="tablewrap"><table><thead><tr><th>Nº / DATA</th><th>ITEM</th><th>COMPRADOR</th><th>VALOR</th><th>PAGO / SALDO</th>{costs&&<th>MARGEM</th>}<th>SITUAÇÃO</th><th/></tr></thead><tbody>
    {shownS.map((v:any)=>{return <tr key={v.id} className={v.status==='Cancelada'?'dim':''}><td><strong>#{v.number}</strong><br/><small>{dateBR(v.created)}</small></td><td><strong>{item(v).name}</strong><br/><small>{item(v).sub} · garantia {v.warranty} dias</small></td><td>{clientName(v)}</td><td>{brl(v.price)}</td><td>{brl(v.paid)}<br/><small>saldo {brl(v.price-v.paid)}</small></td>{costs&&<td>{brl(v.price-v.cost)}</td>}
     <td><span className={'badge '+(v.status==='Cancelada'?'gray':v.paid>=v.price?'green':'blue')}><i/>{v.status==='Cancelada'?'Cancelada':v.paid>=v.price?'Paga':'Em aberto'}</span></td>
     <td className="rowactions">{v.status==='Concluída'&&<>{v.paid<v.price&&<button className="iconbtn" title="Receber" aria-label={'Receber na venda '+v.number} onClick={()=>setModal({title:'Receber — venda #'+v.number,action:'asic_sale_payment',extra:{sale:v.id},form:<><Fld label={'Valor (saldo '+brl(v.price-v.paid)+') *'} name="amount" type="number" min="0.01" step="0.01" max={v.price-v.paid} defaultValue={v.price-v.paid} required/><Sel label="Forma *" name="method" options={METHODS}/></>})}><Banknote size={15}/></button>}
      {admin&&<button className="iconbtn" title="Cancelar venda" aria-label={'Cancelar venda '+v.number} onClick={()=>cancel(v)}><Ban size={15}/></button>}</>}</td></tr>})}
   </tbody></table>
   {!sales.length&&<div className="empty"><HandCoins size={32}/><h3>Nenhuma venda registrada</h3><p>Use "Vender" em uma máquina disponível para registrar a venda.</p></div>}</div>}
  </section>
  {modal&&<div className="overlay" onClick={()=>setModal(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="sl-title" onClick={e=>e.stopPropagation()}>
   <div className="modalhead"><div><span className="eyebrow">VENDAS</span><h2 id="sl-title">{modal.title}</h2></div><button className="iconbtn" aria-label="Fechar" onClick={()=>setModal(null)}><X/></button></div>
   <form className="formgrid" onSubmit={submit} key={modal.title}>{modal.form}<div className="formfoot"><button className="btn primary" disabled={busy}><Save size={15}/>{busy?'Salvando…':'Salvar'}</button></div></form></section></div>}
 </>;
}
const Buyer=({clients,client,setClient}:any)=><><label className="field full"><span>Comprador</span><select name="client" value={client} onChange={e=>setClient(e.target.value)}><option value="">Comprador avulso (informar nome)</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{!client&&<Fld label="Nome do comprador *" name="buyer" required maxLength={120}/>}</>;
function PartSaleForm({parts,clients}:any){
 const [client,setClient]=useState(''),[part,setPart]=useState(parts.find((x:any)=>x.stock>0)?.id||''),[qty,setQty]=useState(1),p=parts.find((x:any)=>x.id===part);
 if(!parts.some((x:any)=>x.stock>0))return <p className="full muted">Nenhuma peça com saldo no estoque.</p>;
 return <>
  <label className="field full"><span>Peça *</span><select name="part" value={part} onChange={e=>setPart(e.target.value)}>{parts.filter((x:any)=>x.stock>0).map((x:any)=><option key={x.id} value={x.id}>{x.name} — saldo {x.stock}</option>)}</select></label>
  <Fld label="Quantidade *" name="qty" type="number" min="1" max={p?.stock} step="1" value={qty} onChange={(e:any)=>setQty(Number(e.target.value))} required/>
  <Fld label="Valor total (R$) *" name="price" type="number" min="0" step="0.01" key={part+'-'+qty} defaultValue={((p?.price||0)*qty).toFixed(2)} required/>
  <Buyer clients={clients} client={client} setClient={setClient}/>
  <Fld label="Valor pago agora (R$)" name="paid" type="number" min="0" step="0.01" defaultValue={0}/><Sel label="Forma de pagamento *" name="method" options={METHODS}/><Fld label="Garantia (dias)" name="warranty" type="number" min="0" max="3650" step="1" defaultValue={0}/>
  <label className="field full"><span>Observações</span><textarea name="notes" rows={2} maxLength={2000}/></label></>;
}
function SaleForm({m,clients}:any){
 const [client,setClient]=useState('');
 return <>
  <Buyer clients={clients} client={client} setClient={setClient}/>
  <Fld label="Valor da venda (R$) *" name="price" type="number" min="0" step="0.01" defaultValue={m.price} required/><Fld label="Valor pago agora (R$)" name="paid" type="number" min="0" step="0.01" defaultValue={0}/>
  <Sel label="Forma de pagamento *" name="method" options={METHODS}/><Fld label="Garantia (dias)" name="warranty" type="number" min="0" max="3650" step="1" defaultValue={30}/>
  <label className="field full"><span>Observações</span><textarea name="notes" rows={2} maxLength={2000}/></label></>;
}
