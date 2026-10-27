// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Gera marketing/folder-bancada-asic.html (arte do folder). Ícones: lucide-react, os mesmos do app.
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Cpu,Camera,QrCode,Layers,Truck,ClipboardCheck,FlaskConical,Tag,Settings2,ShieldCheck,Recycle,Timer,Building2,BookOpen,ChartNoAxesCombined,Users,MessageCircle,Lock,Printer,Wrench,Check} from 'lucide-react';
import {writeFileSync} from 'node:fs';
const I=(C,size=34,color='#fff')=>renderToStaticMarkup(React.createElement(C,{size,color,strokeWidth:1.9}));
const CONTACT=process.env.CONTATO||'';
const sections=[
 {t:'Do recebimento à entrega',c:'#2f6fe4',items:[
  [Camera,'Check-in completo','Fotos da entrada, máquina completa ou faltando itens, e número de série obrigatório (ou ilegível).'],
  [QrCode,'Rastreabilidade','QR Code e etiqueta, composição da mineradora, transferência de peças e histórico com responsável.'],
  [Layers,'Lotes de fazendas','Recebimento por remessa, conferência e uma OS individual por equipamento.'],
  [Truck,'Devolução controlada','Embalagem com fotos, transportadora, rastreio e comprovante de entrega.']]},
 {t:'Reparo e testes com critério',c:'#7a4fd6',items:[
  [ClipboardCheck,'Diagnóstico guiado','Roteiro por modelo e revisão, checklist e mapa de defeitos na hashboard.'],
  [FlaskConical,'Testes de estabilidade','Bancadas e instrumentos calibrados, reserva sem conflito e aprovação pelos critérios da sua assistência.'],
  [Settings2,'Firmware documentado','Versão recebida e entregue, autorização do cliente e backup de acesso restrito.'],
  [ShieldCheck,'Retorno e garantia','Prazo calculado por componente e controle de reincidência.']]},
 {t:'Orçamento e gestão',c:'#1f9d6b',items:[
  [Tag,'Tabela de preços','O técnico escolhe o item da tabela com preço e garantia prontos. Fora da tabela, só com aviso.'],
  [Recycle,'Sucata e peças','Placas doadoras, componentes recuperados e lote da peça usada.'],
  [Timer,'Viabilidade','Reparar ou substituir, com as premissas registradas.'],
  [Building2,'Contratos e campo','SLA, limite de aprovação, preventivas e visitas agendadas.'],
  [BookOpen,'Base de conhecimento','Casos de reparo pesquisáveis por modelo e revisão.'],
  [ChartNoAxesCombined,'Indicadores','Tempo até a entrega, primeiro teste aprovado, reincidência e falhas por modelo.']]},
 {t:'Seu cliente sempre informado',c:'#d9731f',items:[
  [Users,'Portal do cliente','Equipamentos, OS, laudos e aprovação do orçamento por componente.'],
  [MessageCircle,'Painel por código',"Link ou código de acesso, sem login. O cliente manda mensagem e fotos, com respostas rápidas.",'VERSÃO PAGA'],
  [Lock,'Cada um vê o seu','Perfis de administrador, atendente, técnico e cliente. Comentário interno ou visível ao cliente.'],
  [Printer,'Laudo e relatórios','Laudo técnico em PDF, etiqueta QR e exportação em CSV.']]}
];
const card=([Ic,t,d,tag],col)=>`<article class="card"><div class="ic" style="background:${col}">${I(Ic)}</div><div><h3>${t}${tag?`<span class="tag">${tag}</span>`:''}</h3><p>${d}</p></div></article>`;
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Bancada ASIC — folder</title><style>
*{box-sizing:border-box;margin:0}body{width:1080px;background:#f3f6fb;font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif;color:#172944;-webkit-font-smoothing:antialiased}
.hero{background:linear-gradient(160deg,#0f1f38 0%,#172944 55%,#1d3a6b 100%);color:#fff;padding:70px 64px 64px;position:relative;overflow:hidden}
.hero:before{content:"";position:absolute;right:-120px;top:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,#326ce540,transparent 70%)}
.grid{position:absolute;right:48px;bottom:40px;display:grid;grid-template-columns:repeat(6,22px);gap:8px;opacity:.28}.grid i{display:block;width:22px;height:22px;border-radius:5px;border:2px solid #8fb2ff}
.brand{display:flex;align-items:center;gap:16px;font-size:46px;font-weight:800;letter-spacing:-1.5px;position:relative}.brand .lg{width:66px;height:66px;border-radius:18px;background:#326ce5;display:grid;place-items:center}.brand b{color:#5b95ff}
h1{font-size:76px;line-height:1.04;letter-spacing:-2.5px;margin:46px 0 22px;font-weight:800;position:relative;max-width:900px}h1 em{font-style:normal;color:#7fb0ff}
.sub{font-size:33px;line-height:1.35;color:#cfdcf5;max-width:820px;position:relative}
.chips{display:flex;gap:14px;margin-top:38px;flex-wrap:wrap;position:relative}.chips span{display:flex;align-items:center;gap:10px;background:#ffffff1c;border:1px solid #ffffff33;border-radius:999px;padding:11px 18px;font-size:24px;font-weight:600;white-space:nowrap}.mini{display:none;padding:34px 48px 44px;text-align:center;color:#51617b;font-size:26px;font-weight:600}.mini b{color:#2f6fe4}
.sec{padding:52px 48px 8px}.sec h2{display:flex;align-items:center;gap:16px;font-size:44px;letter-spacing:-1.2px;margin-bottom:26px}.sec h2:before{content:"";width:12px;height:46px;border-radius:6px;background:var(--c)}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.card{background:#fff;border:1px solid #dfe6f2;border-radius:24px;padding:28px 26px;display:flex;gap:20px;align-items:flex-start;box-shadow:0 6px 18px #17294410}
.ic{flex:none;width:68px;height:68px;border-radius:20px;display:grid;place-items:center}
.card h3{font-size:33px;line-height:1.15;letter-spacing:-.6px;margin-bottom:9px}.card p{font-size:26px;line-height:1.38;color:#3d4d66}
.tag{display:inline-block;vertical-align:middle;margin-left:12px;background:#fff1de;color:#a24f00;border:2px solid #f0c48c;border-radius:10px;padding:3px 12px;font-size:20px;letter-spacing:.5px;font-weight:800}
.cta{margin:56px 48px 0;background:linear-gradient(135deg,#326ce5,#1d4fc2);border-radius:32px;padding:54px 52px;color:#fff;text-align:center}
.cta h2{font-size:56px;letter-spacing:-1.5px;line-height:1.1}.cta p{font-size:31px;margin-top:18px;color:#dbe7ff;line-height:1.35}
.pill{display:inline-flex;align-items:center;gap:12px;margin-top:30px;background:#fff;color:#1d4fc2;border-radius:999px;padding:20px 44px;font-size:36px;font-weight:800}
.contact{margin-top:22px;font-size:40px;font-weight:800;letter-spacing:.5px}
.foot{padding:38px 48px 52px;text-align:center;color:#51617b;font-size:23px;line-height:1.45}
</style></head><body>
<header class="hero"><div class="grid">${Array.from({length:24},()=>'<i></i>').join('')}</div>
<div class="brand"><span class="lg">${I(Wrench,38)}</span>bancada<b>•</b></div>
<h1>Gestão completa para <em>assistência de mineradoras ASIC</em></h1>
<p class="sub">Do check-in à entrega: cada equipamento rastreado, cada teste registrado e o cliente sempre informado.</p>
<div class="chips"><span>${I(Cpu,28)} Feito para ASIC</span><span>${I(Check,28)} Série e QR de cada peça</span><span>${I(ShieldCheck,28)} Acesso por perfil</span></div></header>
${sections.map(s=>`<section class="sec" style="--c:${s.c}"><h2>${s.t}</h2><div class="cards">${s.items.map(i=>card(i,s.c)).join('')}</div></section>`).join('')}
<section class="cta"><h2>Organize sua bancada.<br>Encante seu cliente.</h2><p>Peça uma demonstração e veja o sistema funcionando com a rotina da sua assistência.</p><span class="pill">${I(MessageCircle,36,'#1d4fc2')} Fale com a gente</span>${CONTACT?`<div class="contact">${CONTACT}</div>`:''}</section>
<div class="mini"></div>
<footer class="foot">Bancada · gestão para assistência técnica de mineradoras ASIC.<br>O painel do cliente por código é um recurso da versão paga.</footer>
<script>
// ?slide=1|2|3 mostra só uma parte (cartões para enviar em sequência); sem parâmetro mostra o folder inteiro.
const n=new URLSearchParams(location.search).get('slide');
if(n){const parts={1:['.hero','.sec:nth-of-type(1)'],2:['.sec:nth-of-type(2)','.sec:nth-of-type(3)'],3:['.sec:nth-of-type(4)','.cta','.foot']};
 const keep=new Set(parts[n].flatMap(s=>[...document.querySelectorAll(s)]));
 document.querySelectorAll('.hero,.sec,.cta,.foot').forEach(e=>{if(!keep.has(e))e.style.display='none'});
 if(n!=='3'){const m=document.querySelector('.mini');m.style.display='block';m.innerHTML='<b>bancada</b> · continua no próximo cartão →'}}
</script></body></html>`;
writeFileSync(new URL('./folder-bancada-asic.html',import.meta.url),html);console.log('html ok',html.length);
