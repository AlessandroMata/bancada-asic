// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState} from 'react';
import {Eye,EyeOff,Send} from 'lucide-react';
const QUICK=['Recebemos seu equipamento e ele está em análise.','Orçamento enviado. Aguardamos a sua aprovação.','Solicitamos a peça ao fornecedor e avisaremos a previsão.','Testes concluídos com sucesso.','Seu equipamento está pronto para retirada.','Precisamos de fotos da etiqueta e das placas para continuar.'];
const when=(v:string)=>new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
// Comentários da OS: cada um é interno (oculto ao cliente) ou visível ao cliente; o cliente só recebe os visíveis.
export default function OrderComments({order,act}:{order:any;act:Function}){
 const [text,setText]=useState(''),[visible,setVisible]=useState('Não'),[busy,setBusy]=useState(false),list=[...(order.comments||[])].reverse();
 async function send(e:React.FormEvent){e.preventDefault();setBusy(true);const ok=await act('asic_comment',{order:order.id,text,visible},false);if(ok)setText('');setBusy(false)}
 return <div className="commentpanel">
  <form onSubmit={send} className="commentform">
   <div className="chips" role="group" aria-label="Respostas rápidas">{QUICK.map(q=><button type="button" className="chip" key={q} onClick={()=>{setText(text?text+' '+q:q);setVisible('Sim')}}>{q}</button>)}</div>
   <label className="field"><span>Novo comentário</span><textarea required rows={3} maxLength={2000} value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma observação sobre esta OS"/></label>
   <div className="commentbar">
    <label className="field"><span>Quem pode ver</span><select value={visible} onChange={e=>setVisible(e.target.value)}><option value="Não">Interno — oculto ao cliente</option><option value="Sim">Visível ao cliente</option></select></label>
    <button className="btn primary" disabled={busy||!text.trim()}><Send size={15}/>{busy?'Salvando…':'Comentar'}</button>
   </div>
   <p className="muted">As respostas rápidas já marcam como visível ao cliente; confira antes de enviar. O cliente vê apenas os comentários marcados como visíveis, sem o nome de quem escreveu.</p>
  </form>
  <ul className="commentlist" aria-label="Comentários">
   {list.map((c:any)=><li key={c.id} className={(c.visible?'':'internal ')+(c.fromClient?'fromclient':'')}><div className="commenthead"><strong>{c.user}</strong><span className="muted">{when(c.at)}</span>{c.fromClient&&<span className="badge blue">Mensagem do cliente</span>}<span className={'badge '+(c.visible?'green':'gray')}>{c.visible?<Eye size={12}/>:<EyeOff size={12}/>}{c.visible?'Visível ao cliente':'Interno'}</span></div><p>{c.text}</p></li>)}
  </ul>
  {!list.length&&<p className="muted">Nenhum comentário nesta OS ainda.</p>}
 </div>;
}
