// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Gera marketing/folder-bancada-asic-lista.html: todas as funcionalidades em lista, para uma imagem só.
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Cpu,Camera,QrCode,Layers,Truck,ClipboardCheck,FlaskConical,Tag,Settings2,ShieldCheck,Recycle,Timer,Building2,BookOpen,ChartNoAxesCombined,Users,MessageCircle,Lock,Printer,Wrench} from 'lucide-react';
import {writeFileSync} from 'node:fs';
const I=(C,size=26,color='#fff')=>renderToStaticMarkup(React.createElement(C,{size,color,strokeWidth:2}));
const CONTACT=process.env.CONTATO||'';
const sections=[
 {t:'Do recebimento à entrega',c:'#2f6fe4',items:[
  [Camera,'Check-in completo','Fotos, série obrigatória e entrada completa ou faltando itens.'],
  [QrCode,'Rastreabilidade','QR Code, etiqueta e histórico de cada peça.'],
  [Layers,'Lotes de fazendas','Recebimento por remessa e uma OS por equipamento.'],
  [Truck,'Devolução controlada','Embalagem com fotos, rastreio e comprovante.']]},
 {t:'Reparo e testes com critério',c:'#7a4fd6',items:[
  [ClipboardCheck,'Diagnóstico guiado','Roteiro por modelo, checklist e mapa de defeitos.'],
  [FlaskConical,'Testes de estabilidade','Bancadas calibradas e aprovação pelos seus critérios.'],
  [Settings2,'Firmware documentado','Versão recebida e entregue, com autorização do cliente.'],
  [ShieldCheck,'Retorno e garantia','Prazo por componente e controle de reincidência.']]},
 {t:'Orçamento e gestão',c:'#1f9d6b',items:[
  [Tag,'Tabela de preços','O técnico escolhe o item com preço e garantia prontos.'],
  [Recycle,'Sucata e peças','Placas doadoras e componentes recuperados, com lote.'],
  [Timer,'Viabilidade','Reparar ou substituir, com as premissas registradas.'],
  [Building2,'Contratos e campo','SLA, limite de aprovação, preventivas e visitas.'],
  [BookOpen,'Base de conhecimento','Casos de reparo pesquisáveis por modelo.'],
  [ChartNoAxesCombined,'Indicadores','Tempo de entrega, reincidência e falhas por modelo.']]},
 {t:'Seu cliente sempre informado',c:'#d9731f',items:[
  [Users,'Portal do cliente','Equipamentos, OS, laudos e aprovação por componente.'],
  [MessageCircle,'Painel por código','Sem login: mensagens e fotos, com respostas rápidas.','VERSÃO PAGA'],
  [Lock,'Cada um vê o seu','Perfis por função; comentário interno ou visível.'],
  [Printer,'Laudo e relatórios','Laudo em PDF, etiqueta QR e exportação CSV.']]}
];
const row=([Ic,t,d,tag],col)=>`<li><span class="ic" style="background:${col}">${I(Ic)}</span><div><b>${t}</b>${tag?`<span class="tag">${tag}</span>`:''}<p>${d}</p></div></li>`;
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Bancada ASIC — lista</title><style>
*{box-sizing:border-box;margin:0}body{width:1080px;background:#f3f6fb;font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif;color:#172944;-webkit-font-smoothing:antialiased}
.top{background:linear-gradient(160deg,#0f1f38,#172944 55%,#1d3a6b);color:#fff;padding:40px 56px 36px}
.brand{display:flex;align-items:center;gap:14px;font-size:40px;font-weight:800;letter-spacing:-1.2px}.brand .lg{width:56px;height:56px;border-radius:16px;background:#326ce5;display:grid;place-items:center}.brand b{color:#5b95ff}
h1{font-size:54px;line-height:1.08;letter-spacing:-1.8px;margin:22px 0 12px;font-weight:800}h1 em{font-style:normal;color:#7fb0ff}
.sub{font-size:29px;line-height:1.35;color:#cfdcf5}
.sec{padding:28px 56px 0}.sec h2{display:flex;align-items:center;gap:14px;font-size:36px;letter-spacing:-1px;margin-bottom:12px}.sec h2:before{content:"";width:10px;height:38px;border-radius:5px;background:var(--c)}
ul{list-style:none;padding:0;background:#fff;border:1px solid #dfe6f2;border-radius:22px;overflow:hidden}
li{display:flex;gap:20px;align-items:center;padding:15px 24px;border-top:1px solid #e8edf6}li:first-child{border-top:0}
.ic{flex:none;width:50px;height:50px;border-radius:15px;display:grid;place-items:center}
li b{font-size:31px;letter-spacing:-.5px;line-height:1.2}li p{font-size:26px;line-height:1.3;color:#3d4d66;margin-top:2px}
.tag{display:inline-block;vertical-align:middle;margin-left:12px;background:#fff1de;color:#a24f00;border:2px solid #f0c48c;border-radius:9px;padding:2px 11px;font-size:19px;letter-spacing:.5px;font-weight:800}
.cta{margin:34px 56px 0;background:linear-gradient(135deg,#326ce5,#1d4fc2);border-radius:28px;padding:32px 40px;color:#fff;text-align:center}
.cta h2{font-size:46px;letter-spacing:-1.2px;line-height:1.1}.cta p{font-size:28px;margin-top:12px;color:#dbe7ff;line-height:1.35}.contact{margin-top:18px;font-size:38px;font-weight:800}
.foot{padding:30px 56px 44px;text-align:center;color:#51617b;font-size:22px;line-height:1.45}
</style></head><body>
<header class="top"><div class="brand"><span class="lg">${I(Wrench,32)}</span>bancada<b>•</b></div>
<h1>Tudo o que o sistema faz pela sua <em>assistência de mineradoras ASIC</em></h1><p class="sub">Do check-in à entrega, cada equipamento rastreado e o cliente sempre informado.</p></header>
${sections.map(s=>`<section class="sec" style="--c:${s.c}"><h2>${s.t}</h2><ul>${s.items.map(i=>row(i,s.c)).join('')}</ul></section>`).join('')}
<section class="cta"><h2>Organize sua bancada. Encante seu cliente.</h2><p>Peça uma demonstração e veja o sistema funcionando com a rotina da sua assistência.</p>${CONTACT?`<div class="contact">${CONTACT}</div>`:''}</section>
<footer class="foot">Bancada · gestão para assistência técnica de mineradoras ASIC.<br>O painel do cliente por código é um recurso da versão paga.</footer>
</body></html>`;
writeFileSync(new URL('./folder-bancada-asic-lista.html',import.meta.url),html);console.log('ok',html.length);
