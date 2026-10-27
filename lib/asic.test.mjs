// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,mutate,total} from './domain.mjs';
import {can,resolved,DEFAULTS,PERMS} from './perms.mjs';
import {upgrade,asicMutate,beforeLegacy,visibleState,indicators,evaluateTest,applyContract,publicPanel,newPanelCode,panelCodeFrom,clientMessage,clientPhoto} from './asic.mjs';
const admin={id:'admin',name:'Admin',email:'admin@test.local',role:'Administrador'},tech={id:'tech',name:'Técnico',email:'tech@test.local',role:'Técnico'},att={id:'att',name:'Atendente',role:'Atendente'};
const run=(s,action,p,u=admin)=>asicMutate(s,u,'asic_'+action,p);
function fixture(){const s=upgrade(empty());s.users=[admin,tech,att].map(u=>structuredClone(u));mutate(s,admin,'client',{name:'Fazenda A',phone:'11999999999'});mutate(s,admin,'client',{name:'Fazenda B',phone:'11888888888'});const client=s.clients[0].id;run(s,'asset',{client,kind:'Mineradora',model:'Modelo A',revision:'R1',serial:'M1'});run(s,'asset',{client,kind:'Hashboard',model:'Modelo A',revision:'R1',serial:'HB1',parent:s.assets[0].id});mutate(s,admin,'order',{client,type:'Mineradora ASIC',model:'Modelo A',issue:'Não reconhece placa',priority:'Normal',tech:'tech'});const order=s.orders[0].id,asset=s.assets[1].id;run(s,'link_order',{order,assets:s.assets.map(a=>a.id)});return {s,client,order,asset}}
function routine(s){run(s,'routine',{name:'Roteiro modelo A',model:'Modelo A',revision:'R1',version:'1',source:'Procedimento da bancada',steps:'Inspeção\nMedição',minHash:90,maxTemp:80,maxPower:3500,maxErrors:2,minDuration:1,expectedChips:100});return s.routines[0].id}
function booking(s,order){run(s,'bench',{name:'Bancada 1',type:'Bancada',serial:'B1',location:'Sala',calibrationRequired:'Não'});run(s,'booking',{order,bench:s.benches[0].id,start:new Date(Date.now()-3600000).toISOString(),end:new Date(Date.now()+3600000).toISOString()});return s.bookings[0].id}
test('OS em lote preservam o vínculo e evitam duplicação de abertas',()=>{const {s,client}=fixture();s.orders[0].status='Entregue';run(s,'lot',{client,name:'Lote QA',expected:1,assets:[s.assets[0].id],received:'2026-10-26'});run(s,'lot_orders',{lot:s.lots[0].id,issue:'Triagem de lote',priority:'Normal',tech:'tech'});assert.equal(s.orders.length,2);assert.equal(s.orders[1].assetIds.length,2);assert.equal(s.orders[1].lot,s.lots[0].id);assert.throws(()=>run(s,'lot_orders',{lot:s.lots[0].id,issue:'Triagem',priority:'Normal'}),/já têm OS/)});
test('calibração renovada libera reserva e horários usam Brasília',()=>{const {s,order}=fixture();run(s,'bench',{name:'Instrumento',type:'Instrumento',serial:'I1',location:'Sala',calibrationRequired:'Sim',calibrationDue:'2000-01-01'});run(s,'bench_calibrate',{bench:s.benches[0].id,calibrationDue:'2099-01-01',reference:'Certificado QA'});run(s,'booking',{order,bench:s.benches[0].id,start:'2026-10-26T10:00',end:'2026-10-26T11:00'});assert.equal(s.bookings[0].start,'2026-10-26T13:00:00.000Z');assert.equal(s.benches[0].calibrationReference,'Certificado QA')});
test('contrato aplica prioridade e prazo por hora à abertura',()=>{const {s,client}=fixture();run(s,'contract',{client,name:'C1',start:'2000-01-01',end:'2099-01-01',slaHours:24,priority:'Alta',approvalLimit:1000,approvers:'a@test.local',terms:'Termos',preventiveDays:30});applyContract(s,s.orders[0],'2026-10-26T22:00:00.000Z');assert.equal(s.orders[0].priority,'Alta');assert.equal(s.orders[0].slaDue,'2026-10-27T22:00:00.000Z')});
test('retorno identifica garantia do componente e preserva a ordem original',()=>{const {s,client,order,asset}=fixture();const original=s.orders[0];original.status='Entregue';original.delivered=new Date().toISOString();original.items=[{id:'i',component:asset,decision:'Aprovado',warranty:30,description:'Reparo',price:0,qty:1,cost:0}];mutate(s,admin,'order',{client,type:'Hashboard',model:'Modelo A',issue:'Falha retornou',priority:'Normal',tech:'tech'});const next=s.orders[1];run(s,'link_order',{order:next.id,assets:[asset]});run(s,'return',{order:next.id,original:order,asset,classification:'Mesmo defeito',covered:'Sim',reason:'Reincidência confirmada'});assert.equal(s.returns[0].warrantyDays,30);assert.equal(s.returns[0].withinWindow,true);assert.equal(next.parent,original.id);assert.equal(original.status,'Entregue')});
test('rastreabilidade: série única, transferências temporárias e isolamento de clientes',()=>{const {s,client,asset}=fixture();assert.throws(()=>run(s,'asset',{client,kind:'Fonte',model:'A',serial:'HB1'}),/já cadastrad[oa]/);run(s,'asset',{client:s.clients[1].id,kind:'Mineradora',model:'A',revision:'R1',serial:'M2'});assert.throws(()=>run(s,'transfer',{asset,target:s.assets[2].id,reason:'Teste'}),/mesmo cliente/);run(s,'transfer',{asset,target:'',reason:'Teste avulso',temporary:'Sim'});assert.equal(s.assets[1].parent,null);assert.equal(s.assetEvents.at(-1).temporary,true)});
test('conferência de lotes impede mistura e quantidade excessiva',()=>{const {s,client}=fixture();run(s,'lot',{client,name:'Remessa',expected:2,assets:[s.assets[0].id],received:'2026-10-26'});assert.equal(s.lots[0].assets.length,1);assert.throws(()=>run(s,'lot_update',{lot:s.lots[0].id,assets:s.assets.map(a=>a.id),closed:true}),/OS abertas/);assert.throws(()=>run(s,'lot',{client,name:'Duplicado',expected:1,assets:[s.assets[0].id]}),/lote aberto/)});
test('diagnóstico exige checklist completo e roteiro compatível',()=>{const {s,order,asset}=fixture(),r=routine(s);assert.throws(()=>run(s,'diagnostic',{order,asset,routine:r,checks:['Conforme'],findings:'Falha',oxidation:'Não',dust:'Baixa'}),/Resultado/);run(s,'diagnostic',{order,asset,routine:r,checks:['Conforme','Falha'],findings:'Alimentação instável',measurements:'TP1: 12 V',oxidation:'Não',dust:'Baixa'});assert.equal(s.diagnostics[0].checks.length,2);s.assets[1].revision='R2';assert.throws(()=>run(s,'diagnostic',{order,asset,routine:r}),/incompatível/)});
test('mapa de defeitos valida coordenadas e mantém reparo',()=>{const {s,order,asset}=fixture();run(s,'defect',{order,asset,x:25,y:40,component:'U12',reading:'0 V',solution:'Substituição',replaced:'CI'});assert.equal(s.defects[0].x,25);assert.throws(()=>run(s,'defect',{order,asset,x:101,y:40}),/inválido/)});
test('bancadas: conflito de agenda e calibração vencida',()=>{const {s,order}=fixture();booking(s,order);assert.throws(()=>run(s,'booking',{order,bench:s.benches[0].id,start:new Date().toISOString(),end:new Date(Date.now()+60000).toISOString()}),/reservado/);run(s,'bench',{name:'Multímetro',type:'Instrumento',serial:'I1',location:'Bancada',calibrationRequired:'Sim',calibrationDue:'2000-01-01'});assert.throws(()=>run(s,'booking',{order,bench:s.benches[1].id,start:new Date().toISOString(),end:new Date(Date.now()+60000).toISOString()}),/Calibração/)});
test('teste usa tempo real, evidências e pior amostra para reprovar',()=>{const {s,order,asset}=fixture(),r=routine(s),b=booking(s,order);run(s,'session_start',{order,asset,routine:r,booking:b,phase:'Depois',firmware:'Original',configuration:'Padrão',conditions:'Bancada ventilada'});const session=s.sessions[0].id;s.sessions[0].started=new Date(Date.now()-120000).toISOString();run(s,'sample',{session,hashrate:95,temperature:70,power:3200,errors:0,chips:100});run(s,'sample',{session,hashrate:80,temperature:85,power:3200,errors:0,chips:100});assert.throws(()=>run(s,'session_finish',{session,reason:'Fim',interrupted:'Não'}),/evidência/);s.orders[0].attachments.push({id:'test-evidence',category:'Evidência de teste',at:new Date().toISOString()});run(s,'session_finish',{session,reason:'Falha térmica',interrupted:'Não'});assert.equal(s.sessions[0].status,'Reprovado');assert.equal(s.assets[1].status,'Reparo')});
test('sessão aprovada libera componente e gate de conclusão',()=>{const {s,order,asset}=fixture(),r=routine(s),b=booking(s,order);run(s,'quote',{order,items:[{component:asset,description:'Reparo',qty:1,price:200,cost:80,warranty:90}],discount:0});run(s,'decision',{order,component:asset,decision:'Aprovado',channel:'Presencial'});assert.throws(()=>beforeLegacy(s,admin,'update',{id:order,status:'Pronto para retirada'}),/testado/);run(s,'session_start',{order,asset,routine:r,booking:b,phase:'Depois',firmware:'Original',configuration:'Padrão',conditions:'Ambiente'});const t=s.sessions[0];t.started=new Date(Date.now()-120000).toISOString();s.orders[0].attachments.push({id:'evidence',category:'Evidência de teste',at:new Date().toISOString()});run(s,'sample',{session:t.id,hashrate:100,temperature:70,power:3200,errors:0,chips:100});run(s,'session_finish',{session:t.id,reason:'Critérios atingidos',interrupted:'Não'});assert.equal(t.status,'Aprovado');assert.doesNotThrow(()=>beforeLegacy(s,admin,'update',{id:order,status:'Pronto para retirada'}))});
test('orçamento parcial exclui recusados e nova versão invalida decisões',()=>{const {s,order,asset}=fixture();run(s,'quote',{order,items:[{component:asset,description:'Reparo placa',qty:1,price:200,cost:80,warranty:90},{component:s.assets[0].id,description:'Limpeza',qty:1,price:50,cost:10,warranty:30}],discount:0});run(s,'decision',{order,component:asset,decision:'Aprovado',channel:'Telefone'});assert.equal(s.orders[0].approval,null);run(s,'decision',{order,component:s.assets[0].id,decision:'Recusado',channel:'Telefone'});assert.equal(total(s.orders[0]),200);assert.equal(s.orders[0].approval.decision,'Aprovado');run(s,'quote',{order,items:[{component:asset,description:'Reparo revisto',qty:1,price:210,cost:80,warranty:90}],discount:0});assert.equal(s.orders[0].items[0].decision,'Pendente')});
test('portal: isolamento completo entre empresas e proteção de custos/backups',()=>{const {s,client,order,asset}=fixture();const customer={id:'cust',email:'c@test.local',role:'Cliente',client,canApprove:true};s.orders[0].attachments=[{id:'backup',category:'Backup',visibility:'Interno'},{id:'public',category:'Laudo',visibility:'Cliente'}];run(s,'quote',{order,items:[{component:asset,description:'Reparo',qty:1,price:200,cost:80,warranty:90}],discount:0});const v=visibleState(s,customer);assert.equal(v.clients.length,1);assert.equal(v.orders[0].items[0].cost,undefined);assert.deepEqual(v.orders[0].attachments.map(a=>a.id),['public']);assert.equal(v.users.length,0);assert.throws(()=>run(s,'asset',{client,kind:'Fonte',model:'X',serial:'X'},customer),/exclusiva/);assert.throws(()=>beforeLegacy(s,customer,'payment',{id:order}),/portal/)});
test('portal exige contrato, aprovador autorizado e limite por OS',()=>{const {s,client,order,asset}=fixture();run(s,'quote',{order,items:[{component:asset,description:'Reparo',qty:1,price:200,cost:80,warranty:90}],discount:0});const customer={id:'cust',email:'c@test.local',name:'Cliente',role:'Cliente',client,canApprove:true};assert.throws(()=>run(s,'decision',{order,component:asset,decision:'Aprovado'},customer),/contrato/);run(s,'contract',{client,name:'C1',start:'2000-01-01',end:'2099-01-01',slaHours:48,priority:'Alta',approvalLimit:100,approvers:'c@test.local',terms:'Termos',preventiveDays:30});assert.throws(()=>run(s,'decision',{order,component:asset,decision:'Aprovado'},customer),/limite/);s.contracts[0].approvalLimit=300;run(s,'decision',{order,component:asset,decision:'Aprovado'},customer);assert.equal(s.orders[0].approval.channel,'Portal do cliente')});
test('firmware preserva autorização e só aceita backup anexado como interno',()=>{const {s,order,asset}=fixture();assert.throws(()=>run(s,'firmware',{order,asset,backup:'unknown'}),/Backup/);s.orders[0].attachments.push({id:'backup',category:'Backup',visibility:'Interno'});run(s,'firmware',{order,asset,received:'1.0',delivered:'1.1',changes:'Atualização autorizada',configuration:'Padrão',consent:'Autorização presencial',channel:'Presencial',backup:'backup'});assert.equal(s.firmwares[0].backup,'backup')});
test('conhecimento nasce de reparo concluído e contém revisão',()=>{const {s,order,asset}=fixture();assert.throws(()=>run(s,'article',{order,asset}),/concluído/);s.orders[0].status='Entregue';run(s,'article',{order,asset,title:'Falha de alimentação',solution:'CI substituído',result:'Teste conforme',tags:'alimentação'});assert.equal(s.articles[0].revision,'R1')});
test('sucata rastreia origem, teste, quantidade e autorização de uso',()=>{const {s,order,asset}=fixture();run(s,'donor',{asset,name:'Doadora HB1',release:'Cessão de propriedade',supplier:'Compra',notes:'Placa danificada'});run(s,'recover',{donor:s.donors[0].id,code:'CI-1',model:'Modelo A R1',qty:2,lot:'L1',location:'Gaveta 1',result:'Testado'});assert.throws(()=>run(s,'use_recovery',{order,asset,recovery:s.recoveries[0].id,qty:1}),/autorização/);run(s,'use_recovery',{order,asset,recovery:s.recoveries[0].id,qty:1,consent:'Cliente aprovou por escrito'});assert.equal(s.recoveries[0].available,1);assert.equal(s.recoveries[0].uses[0].destination,asset);assert.throws(()=>run(s,'use_recovery',{order,asset,recovery:s.recoveries[0].id,qty:2,consent:'Sim'}),/indisponível/)});
test('viabilidade explicita premissas e não inventa retorno para receita negativa',()=>{const {s,order}=fixture();run(s,'viability',{order,repair:200,replacement:500,value:1000,dailyNet:-10,days:5,assumptions:'Valores informados pelo cliente em 26/10/2026',decision:'Aguardar'});assert.equal(s.viabilities[0].breakEven,null);assert.equal(s.viabilities[0].estimatedDowntimeCost,0)});
test('logística exige liberação, fotos de embalagem e comprovante',()=>{const {s,client,order}=fixture();const asset=s.assets[0].id;run(s,'lot',{client,name:'Remessa',expected:1,assets:[asset],received:'2026-10-26'});assert.throws(()=>run(s,'shipment',{lot:s.lots[0].id,assets:[asset]}),/liberado/);s.assets[0].status='Devolvido sem reparo';s.orders[0].status='Pronto para retirada';run(s,'shipment',{lot:s.lots[0].id,assets:[asset],packaging:'Caixa protegida',weight:10,carrier:'Transportadora',insurance:1000});assert.throws(()=>run(s,'shipment_update',{shipment:s.shipments[0].id,status:'Despachado'}),/embalagem/i);s.lots[0].attachments.push({id:'photo',category:'Embalagem'});run(s,'shipment_update',{shipment:s.shipments[0].id,status:'Despachado'});assert.throws(()=>run(s,'shipment_update',{shipment:s.shipments[0].id,status:'Entregue'}),/comprovante/);s.lots[0].attachments.push({id:'proof',category:'Comprovante'});run(s,'shipment_update',{shipment:s.shipments[0].id,status:'Entregue'});assert.equal(s.shipments[0].status,'Entregue')});
test('atendimento em campo exige vigência e gera previsão de preventiva',()=>{const {s,client}=fixture();run(s,'contract',{client,name:'C1',start:'2000-01-01',end:'2099-01-01',slaHours:48,priority:'Alta',approvalLimit:100,approvers:'a@test.local',terms:'Termos',preventiveDays:30});run(s,'visit',{contract:s.contracts[0].id,technician:'tech',scheduled:new Date().toISOString(),location:'Fazenda',type:'Preventiva',task:'Inspeção'});run(s,'visit_finish',{visit:s.visits[0].id,report:'Inspeção concluída'},tech);assert.equal(s.visits[0].status,'Concluído');assert.ok(s.visits[0].nextDate)});
test('técnico não acessa componentes ou sessões de outro técnico',()=>{const {s,order,asset}=fixture();s.orders[0].tech='other';assert.throws(()=>run(s,'asset_update',{order,asset,status:'Reparo'},tech),/atribuído/);assert.equal(visibleState(s,tech).assets.length,0);assert.equal(visibleState(s,tech).orders.length,0)});
test('indicadores agregam margem orçada e tempo sem dados fictícios',()=>{const {s,order,asset}=fixture();run(s,'quote',{order,items:[{component:asset,description:'Reparo',qty:1,price:200,cost:80,warranty:90}],discount:10});const k=indicators(s);assert.equal(k.cost,80);assert.equal(k.quotedMargin,110);assert.equal(k.activeTests,0)});
test('nova OS nasce de equipamento ASIC: cadastra na hora, vincula componentes e bloqueia duplicação',()=>{
 const {s,client}=fixture();s.orders[0].status='Entregue';
 run(s,'order',{client,asset:s.assets[0].id,issue:'Reinicia sozinha',priority:'Alta',accessories:'Fonte',completeness:'Completa'},att);
 const o=s.orders[1];assert.deepEqual(o.assetIds.sort(),s.assets.map(a=>a.id).sort());assert.equal(o.accessories,'Fonte');assert.equal(o.device,undefined);
 assert.throws(()=>run(s,'order',{client,asset:s.assets[1].id,issue:'x',priority:'Normal',completeness:'Completa'},att),/outra OS aberta/);
 run(s,'order',{client,kind:'Mineradora',model:'Modelo B',revision:'R2',serial:'M2',issue:'Não liga',priority:'Normal',completeness:'Completa'},att);
 assert.equal(s.assets.at(-1).serial,'M2');assert.deepEqual(s.orders.at(-1).assetIds,[s.assets.at(-1).id]);
 assert.throws(()=>run(s,'order',{client,kind:'Mineradora',model:'Modelo B',serial:'M2',issue:'x',priority:'Normal',completeness:'Completa'},att),/já cadastrad/);
 assert.throws(()=>run(s,'order',{client:s.clients[1].id,asset:s.assets[0].id,issue:'x',priority:'Normal',completeness:'Completa'},att),/outro cliente/);
 assert.throws(()=>run(s,'order',{client,kind:'Mineradora',model:'M',serial:'M3',issue:'x',priority:'Normal',completeness:'Completa'},tech),/atendimento ou administração/);
});
test('API legada não abre OS solta nem orçamento genérico',()=>{
 const {s,client,order}=fixture();
 assert.throws(()=>beforeLegacy(s,admin,'order',{client}),/equipamento ASIC/);
 assert.throws(()=>beforeLegacy(s,admin,'quote',{id:order,items:[]}),/por componente/);
 assert.throws(()=>beforeLegacy(s,admin,'approve',{id:order,decision:'Aprovado'}),/por componente/);
});
test('painel do cliente: só admin gera/revoga e a projeção pública não vaza valores nem outros clientes',()=>{
 const {s,client,order}=fixture();
 assert.throws(()=>run(s,'panel',{client},att),/Sem permissão para o painel/);
 assert.throws(()=>run(s,'panel',{client}),/inválida/);
 run(s,'panel',{client,enabled:true});const token=s.clients[0].panelCode;assert.match(token,/^[A-HJKMNP-Z2-9]{12}$/);assert.equal(s.clients[0].panelEnabled,true);
 run(s,'panel',{client,enabled:false});assert.equal(s.clients[0].panelEnabled,false);assert.equal(s.clients[0].panelCode,token);
 run(s,'panel',{client,enabled:true});assert.equal(s.clients[0].panelCode,token);
 run(s,'panel',{client,regenerate:true});assert.notEqual(s.clients[0].panelCode,token);
 run(s,'quote',{order,items:[{component:s.assets[1].id,description:'Troca de chip',qty:1,price:777,cost:333,warranty:30}],discount:0});
 s.orders[0].publicNote='Em teste';s.orders[0].diagnosis='segredo interno';s.assets[0].notes='obs interna';
 run(s,'asset',{client:s.clients[1].id,kind:'Mineradora',model:'Outra',serial:'X9'});
 const out=publicPanel(s,client),json=JSON.stringify(out);
 assert.equal(out.client,'Fazenda A');assert.equal(out.orders[0].note,'Em teste');assert.equal(out.orders[0].pendingDecisions,1);assert.equal(out.assets.length,2);assert.equal(out.summary.open,1);
 for(const leak of [':777',':333','segredo interno','obs interna','Outra','panelCode',s.clients[0].panelCode])assert.ok(!json.includes(leak),'vazou: '+leak);
 assert.equal(visibleState(s,tech).clients[0].panelCode,undefined);assert.equal(visibleState(s,tech).clients[0].panelEnabled,undefined);
});
test('código do painel: alfabeto sem ambíguos, sem viés evidente e normalização tolerante',()=>{
 const seen=new Set(),counts={};for(let i=0;i<4000;i++){const c=newPanelCode();assert.match(c,/^[A-HJKMNP-Z2-9]{12}$/);seen.add(c);for(const ch of c)counts[ch]=(counts[ch]||0)+1}
 assert.equal(seen.size,4000);assert.equal(Object.keys(counts).length,31);
 const avg=4000*12/31;for(const n of Object.values(counts))assert.ok(n>avg*0.8&&n<avg*1.2,'distribuição enviesada');
 assert.equal(panelCodeFrom('k7mq-2xh9 pd4t'),'K7MQ2XH9PD4T');assert.equal(panelCodeFrom(' K7MQ2XH9PD4T '),'K7MQ2XH9PD4T');
 for(const bad of ['','K7MQ-2XH9','K7MQ2XH9PD4T9','K7MQ2XH9PD4I','K7MQ2XH9PD4O','K7MQ2XH9PD40',null,undefined,'../../etc/passwd'])assert.equal(panelCodeFrom(bad),null,String(bad));
});
test('gerenciar cliente: atendente edita, técnico não, e-mail é validado',()=>{
 const {s,client}=fixture();
 run(s,'client_update',{client,name:'Fazenda Sol Nova',phone:'31988887777',email:'Contato@Sol.com',document:'12.345.678/0001-90'},att);
 assert.equal(s.clients[0].name,'Fazenda Sol Nova');assert.equal(s.clients[0].email,'contato@sol.com');assert.equal(s.clients[0].document,'12.345.678/0001-90');assert.equal(s.clients[1].name,'Fazenda B');
 assert.throws(()=>run(s,'client_update',{client,name:'X',phone:'1',email:'sem-arroba'},att),/E-mail inválido/);
 assert.throws(()=>run(s,'client_update',{client,name:'',phone:'1'},att),/Informe o nome/);
 assert.throws(()=>run(s,'client_update',{client,name:'X',phone:'1'},tech),/atendimento ou administração/);
});
test('nova OS com cliente novo: cadastra cliente, equipamento e OS juntos; valida e respeita o perfil',()=>{
 const {s}=fixture(),before=s.clients.length;
 run(s,'order',{newClient:{name:'Mineração Nova',phone:'31977776666',email:'A@Nova.com',document:''},kind:'Mineradora',model:'S21',serial:'S21-1',issue:'Não liga',priority:'Normal',completeness:'Completa'},att);
 const c=s.clients.at(-1),o=s.orders.at(-1);assert.equal(s.clients.length,before+1);assert.equal(c.name,'Mineração Nova');assert.equal(c.email,'a@nova.com');assert.equal(o.client,c.id);assert.equal(s.assets.at(-1).client,c.id);assert.deepEqual(o.assetIds,[s.assets.at(-1).id]);
 assert.throws(()=>run(s,'order',{newClient:{name:'',phone:'1'},kind:'Mineradora',model:'X',serial:'X1',issue:'x',priority:'Normal',completeness:'Completa'},att),/Informe o nome/);
 assert.throws(()=>run(s,'order',{newClient:{name:'Z',phone:'1',email:'ruim'},kind:'Mineradora',model:'X',serial:'X2',issue:'x',priority:'Normal',completeness:'Completa'},att),/E-mail inválido/);
 assert.throws(()=>run(s,'order',{newClient:{name:'Z',phone:'1'},kind:'Mineradora',model:'X',serial:'X3',issue:'x',priority:'Normal',completeness:'Completa'},tech),/perfil|atendimento/);
 assert.throws(()=>run(s,'order',{issue:'x',priority:'Normal',kind:'Mineradora',model:'X',serial:'X4',completeness:'Completa'},att),/Registro não encontrado/);
});
test('tabela de preços: só admin cadastra; orçamento usa o preço do servidor, nunca o enviado',()=>{
 const {s,order,asset}=fixture();
 assert.throws(()=>run(s,'price',{name:'Troca de chip',category:'Serviço',price:300},att),/Sem permissão para a tabela/);
 run(s,'price',{name:'Troca de chip',category:'Serviço',price:300,cost:120,warranty:60});run(s,'price',{name:'Ventoinha',category:'Peça',price:90,cost:40,warranty:30,models:'S19'});
 assert.throws(()=>run(s,'price',{name:'troca de CHIP',category:'Serviço',price:1}),/Já existe/);
 const chip=s.priceItems[0].id;
 run(s,'quote',{order,items:[{component:asset,priceItem:chip,qty:2,price:1,cost:999,warranty:999,description:'ignorado'}],discount:0},tech);
 const it=s.orders[0].items[0];assert.equal(it.price,300);assert.equal(it.cost,120);assert.equal(it.warranty,60);assert.equal(it.description,'Troca de chip');assert.equal(it.free,false);assert.equal(it.priceItem,chip);assert.equal(total(s.orders[0]),600);
 run(s,'price_update',{item:chip,name:'Troca de chip',category:'Serviço',price:500,cost:120,warranty:60});assert.equal(s.orders[0].items[0].price,300,'orçamento antigo não muda com a tabela');
 run(s,'price_update',{item:chip,name:'Troca de chip',category:'Serviço',price:500,active:false});
 assert.throws(()=>run(s,'quote',{order,items:[{component:asset,priceItem:chip,qty:1}],discount:0},tech),/desativado/);
 assert.throws(()=>run(s,'quote',{order,items:[{component:asset,priceItem:'inexistente',qty:1}],discount:0},tech),/não encontrado/);
});
test('item fora da tabela: técnico informa, fica marcado, custo é zerado e desconto é só do atendimento',()=>{
 const {s,order,asset}=fixture();
 run(s,'quote',{order,items:[{component:asset,description:'Solda especial',qty:1,price:80,cost:70,warranty:15}],discount:0},tech);
 const it=s.orders[0].items[0];assert.equal(it.free,true);assert.equal(it.price,80);assert.equal(it.cost,0,'técnico não define custo');
 assert.throws(()=>run(s,'quote',{order,items:[{component:asset,description:'x',qty:1,price:80,warranty:0}],discount:10},tech),/desconto é definido pelo atendimento/);
 run(s,'quote',{order,items:[{component:asset,description:'Solda especial',qty:1,price:80,cost:30,warranty:15}],discount:10},att);assert.equal(s.orders[0].items[0].cost,30);assert.equal(s.orders[0].discount,10);
 assert.throws(()=>run(s,'quote',{order,items:[{component:asset,description:'',qty:1,price:80,warranty:0}],discount:10},att),/Informe a descrição/);
});
test('comentários: interno fica oculto; o cliente vê só o que foi marcado como visível; técnico não vê custo',()=>{
 const {s,order,asset,client}=fixture();
 run(s,'portal_user',{client,name:'Cli',email:'cli@t.com',canApprove:'Sim'});const cli=s.users.at(-1);
 run(s,'price',{name:'Troca de chip',category:'Serviço',price:300,cost:120,warranty:60});
 run(s,'quote',{order,items:[{component:asset,priceItem:s.priceItems[0].id,qty:1,comment:'margem apertada, cliente negocia',commentVisible:false},{component:asset,description:'Limpeza',qty:1,price:50,cost:10,warranty:7,comment:'Inclui banho químico',commentVisible:true}],discount:0},att);
 run(s,'comment',{order,text:'Cliente costuma atrasar pagamento',visible:false},tech);run(s,'comment',{order,text:'Previsão de peça: 3 dias',visible:true},tech);
 assert.throws(()=>run(s,'comment',{order,text:'x',visible:true},cli),/exclusiva da assistência/);
 assert.throws(()=>run(s,'comment',{order,text:'',visible:true},att),/Informe o comentário/);
 const v=visibleState(s,cli),json=JSON.stringify(v);
 assert.equal(v.orders[0].comments.length,1);assert.equal(v.orders[0].comments[0].text,'Previsão de peça: 3 dias');assert.equal(v.orders[0].comments[0].user,undefined);
 assert.equal(v.orders[0].items[0].comment,undefined);assert.equal(v.orders[0].items[1].comment,'Inclui banho químico');
 for(const leak of ['margem apertada','atrasar pagamento','"cost"','"priceItem"','"free"','commentVisible'])assert.ok(!json.includes(leak),'cliente viu: '+leak);
 assert.deepEqual(v.priceItems,[]);
 const t=visibleState(s,tech);assert.ok(!JSON.stringify(t.orders[0].items).includes('"cost"'));assert.ok(!JSON.stringify(t.priceItems).includes('"cost"'));assert.equal(t.priceItems[0].price,300);assert.equal(t.orders[0].comments.length,2,'técnico vê os comentários da própria OS');
 s.priceItems[0].active=false;assert.equal(visibleState(s,tech).priceItems.length,0,'técnico só vê itens ativos');
 const a=visibleState(s,admin);assert.ok(JSON.stringify(a.orders[0].items).includes('"cost"'));
});
test('número de série obrigatório e real, ou "Ilegível"; vale para todos os tipos e para a Nova OS',()=>{
 const {s,client}=fixture(),mk=(extra)=>run(s,'asset',{client,kind:'Mineradora',model:'X',...extra});
 for(const bad of [undefined,'','   ','sem','N/A','n/a','na','nenhum','Não tem','desconhecido','ilegível','Ilegivel','0000','aaaa','----','x','a b!c','é'])assert.throws(()=>mk({serial:bad}),/número de série real/,'aceitou: '+bad);
 for(const kind of ['Mineradora','Hashboard','Fonte','Controladora'])run(s,'asset',{client,kind,model:'M',serial:'SN-'+kind+'-01'});
 assert.throws(()=>run(s,'asset',{client,kind:'Fonte',model:'M',serial:'sn-fonte-01'}),/já cadastrado/,'comparação ignora maiúsculas');
 mk({serialIllegible:true});mk({serialIllegible:'on'});const a1=s.assets.at(-2),a2=s.assets.at(-1);
 assert.equal(a1.serialIllegible,true);assert.match(a1.serial,/^ILEGÍVEL-ASIC-\d{5}$/);assert.notEqual(a1.serial,a2.serial);
 mk({serial:'SN 123/45.A',serialIllegible:false});assert.equal(s.assets.at(-1).serial,'SN 123/45.A');assert.equal(s.assets.at(-1).serialIllegible,false);
 assert.throws(()=>run(s,'order',{client,kind:'Mineradora',model:'X',issue:'x',priority:'Normal',completeness:'Completa'},att),/número de série real/);
 assert.throws(()=>run(s,'order',{client,kind:'Mineradora',model:'X',serial:'sem',issue:'x',priority:'Normal',completeness:'Completa'},att),/número de série real/);
 run(s,'order',{client,kind:'Mineradora',model:'X',serialIllegible:'on',issue:'x',priority:'Normal',completeness:'Completa'},att);assert.equal(s.assets.at(-1).serialIllegible,true);
});
test('corrigir número de série: ilegível vira real sem motivo, real exige motivo, fica auditado e não duplica',()=>{
 const {s,client}=fixture();run(s,'asset',{client,kind:'Fonte',model:'F',serialIllegible:true});const a=s.assets.at(-1);
 run(s,'asset_serial',{asset:a.id,serial:'PSU-998877'},att);assert.equal(a.serial,'PSU-998877');assert.equal(a.serialIllegible,false);
 assert.throws(()=>run(s,'asset_serial',{asset:a.id,serial:'PSU-998878'},att),/Informe o motivo/);
 run(s,'asset_serial',{asset:a.id,serial:'PSU-998878',reason:'Erro de digitação na entrada'},att);assert.equal(a.serial,'PSU-998878');
 assert.ok(s.audit.some(e=>e.asset===a.id&&/PSU-998877 → PSU-998878.*Erro de digitação/.test(e.message)),'sem registro de auditoria');
 assert.throws(()=>run(s,'asset_serial',{asset:a.id,serial:'M1',reason:'x'},att),/já cadastrado/);
 assert.throws(()=>run(s,'asset_serial',{asset:a.id,serial:'sem',reason:'x'},att),/número de série real/);
 assert.throws(()=>run(s,'asset_serial',{asset:a.id,serial:'PSU-1',reason:'x'},tech),/atendimento ou administração/);
 run(s,'asset_serial',{asset:a.id,serialIllegible:true,reason:'Etiqueta apagou'},att);assert.equal(a.serial,'ILEGÍVEL-'+a.code);assert.equal(a.serialIllegible,true);
});
test('entrada do equipamento: completa, ou incompleta com o que falta; fica na OS',()=>{
 const {s,client}=fixture(),base=n=>({client,kind:'Mineradora',model:'X',serial:'ENT-'+n,issue:'x',priority:'Normal'});
 assert.throws(()=>run(s,'order',base(1),att),/Estado de entrega inválido/);
 assert.throws(()=>run(s,'order',{...base(2),completeness:'Incompleta'},att),/Informe o que está faltando/);
 assert.throws(()=>run(s,'order',{...base(3),completeness:'Incompleta',missing:['Asa']},att),/Item faltante inválido/);
 run(s,'order',{...base(4),completeness:'Completa',missing:['Fonte de alimentação']},att);assert.deepEqual(s.orders.at(-1).intake.missing,[],'completa ignora lista de faltantes');assert.equal(s.orders.at(-1).intake.complete,true);
 run(s,'order',{...base(5),completeness:'Incompleta',missing:['Hashboard','Hashboard','Ventoinha'],missingNote:'2 parafusos da tampa'},att);const i=s.orders.at(-1).intake;
 assert.equal(i.complete,false);assert.deepEqual(i.missing,['Hashboard','Ventoinha']);assert.equal(i.note,'2 parafusos da tampa');assert.equal(i.by,'Atendente');
 run(s,'order',{...base(6),completeness:'Incompleta',missingNote:'Sem a tampa traseira'},att);assert.deepEqual(s.orders.at(-1).intake.missing,[]);
 const cli={id:'c',role:'Cliente',client,canApprove:false,email:'c@t.com',name:'C'};const v=visibleState(s,cli).orders.find(o=>o.id===s.orders.at(-2).id);assert.equal(v.intake.complete,false);assert.deepEqual(v.intake.missing,['Hashboard','Ventoinha']);assert.equal(v.intake.by,undefined);
 for(const o of s.orders)assert.ok(o.assetIds?.length>0,'OS sem equipamento vinculado: '+o.number);
});
test('mensagens do cliente: só em OS aberta dele, vinculadas à OS, e o painel mostra só o visível',()=>{
 const {s,client,order}=fixture();run(s,'asset',{client:s.clients[1].id,kind:'Mineradora',model:'Z',serial:'OUTRO-1'});
 run(s,'order',{client:s.clients[1].id,asset:s.assets.at(-1).id,issue:'x',priority:'Normal',completeness:'Completa'},att);const alheia=s.orders.at(-1);
 const n=s.orders[0].number;
 const c=clientMessage(s,client,{order:n,text:'  Qual a previsão?  '});assert.equal(c.text,'Qual a previsão?');assert.equal(c.fromClient,true);assert.equal(c.visible,true);assert.equal(s.orders[0].comments.at(-1).id,c.id);assert.ok(s.orders[0].history.some(h=>/Mensagem do cliente/.test(h.message)));
 assert.throws(()=>clientMessage(s,client,{order:alheia.number,text:'x'}),/Selecione uma OS sua/);
 assert.throws(()=>clientMessage(s,client,{order:'999',text:'x'}),/Selecione uma OS sua/);
 assert.throws(()=>clientMessage(s,client,{order:n,text:'   '}),/Informe a mensagem/);
 assert.throws(()=>clientMessage(s,client,{order:n,text:'a'.repeat(1001)}),/Informe a mensagem/);
 clientPhoto(s,client,{order:n,key:s.orders[0].id+'/abc',name:'etiqueta.jpg',type:'image/jpeg'});const att1=s.orders[0].attachments.at(-1);assert.equal(att1.category,'Cliente');assert.equal(att1.visibility,'Cliente');assert.equal(s.orders[0].comments.at(-1).attachment,att1.id);
 for(let i=0;i<29;i++)clientPhoto(s,client,{order:n,key:'k'+i,name:'f'+i,type:'image/png'});assert.throws(()=>clientPhoto(s,client,{order:n,key:'kx',name:'x',type:'image/png'}),/Limite de fotos/);
 run(s,'comment',{order:s.orders[0].id,text:'Resposta interna secreta',visible:false},att);run(s,'comment',{order:s.orders[0].id,text:'Previsão: sexta-feira',visible:true},att);
 const out=publicPanel(s,client),json=JSON.stringify(out),o0=out.orders.find(o=>o.number===n);
 assert.equal(o0.open,true);assert.ok(o0.comments.some(x=>x.text==='Previsão: sexta-feira'&&x.fromClient===false));assert.ok(o0.comments.some(x=>x.fromClient===true&&x.text==='Qual a previsão?'));
 for(const leak of ['Resposta interna secreta','Cliente (painel)','Atendente','userId'])assert.ok(!json.includes(leak),'painel vazou: '+leak);
 s.orders[0].status='Entregue';assert.throws(()=>clientMessage(s,client,{order:n,text:'oi'}),/já foi encerrada/);assert.throws(()=>clientPhoto(s,client,{order:n,key:'z',name:'z',type:'image/png'}),/já foi encerrada/);
});

test('permissões: padrões reproduzem o comportamento anterior; administrador é fixo; cliente nunca',()=>{
 const R=r=>({role:r});
 assert.deepEqual(Object.keys(resolved(R('Administrador'))).filter(k=>!can(R('Administrador'),k)),[]);
 assert.deepEqual(PERMS.map(([k])=>k).filter(k=>can(R('Atendente'),k)),['verCustos','editarOrcamento','decidirOrcamento','gerenciarClientes','registrarPagamentos']);
 assert.deepEqual(PERMS.map(([k])=>k).filter(k=>can(R('Técnico'),k)),['editarOrcamento']);
 for(const r of ['Cliente','Desativado','Inexistente',undefined])for(const [k] of PERMS)assert.equal(can(r?R(r):null,k),false,r+k);
 assert.equal(can({role:'Administrador',perms:{verCustos:false}},'verCustos'),true,'override não tira nada do administrador');
 assert.equal(can({role:'Cliente',perms:{verCustos:true}},'verCustos'),false,'override não dá nada ao cliente');
 assert.equal(can({role:'Técnico',perms:{verCustos:true}},'verCustos'),true);assert.equal(can({role:'Atendente',perms:{verCustos:false}},'verCustos'),false);
 assert.equal(can({role:'Técnico',perms:{verCustos:'sim'}},'verCustos'),false,'valor não booleano é ignorado');
});
test('permissões: só o administrador personaliza, só atendente/técnico, guarda só o que difere e some ao trocar o perfil',()=>{
 const {s}=fixture(),tecU=s.users.find(x=>x.id==='tech'),attU=s.users.find(x=>x.id==='att');
 assert.throws(()=>run(s,'user_perms',{user:'tech',perms:{verCustos:true}},att),/administrador/);
 assert.throws(()=>run(s,'user_perms',{user:'admin',perms:{verCustos:false}},admin),/atendentes e técnicos/);
 assert.throws(()=>run(s,'user_perms',{user:'tech',perms:{voar:true}},admin),/Permissão desconhecida/);
 run(s,'user_perms',{user:'tech',perms:{verCustos:true,editarOrcamento:true,decidirOrcamento:false}},admin);
 assert.deepEqual(tecU.perms,{verCustos:true},'só o que difere do padrão do Técnico');
 run(s,'user_perms',{user:'att',perms:{verCustos:false,gerenciarPrecos:true}},admin);assert.deepEqual(attU.perms,{verCustos:false,gerenciarPrecos:true});
 run(s,'user_perms',{user:'tech',perms:{}},admin);assert.equal(tecU.perms,undefined,'vazio restaura o padrão');
 run(s,'user_perms',{user:'att',perms:{gerenciarPrecos:true}},admin);mutate(s,admin,'userrole',{user:'att',role:'Técnico'});assert.equal(attU.perms,undefined,'trocar o perfil zera as personalizações');
 assert.ok(s.audit.some(e=>/Permissões de .* (personalizadas|restauradas)/.test(e.message)));
});
test('permissões aplicadas: cada liberação ou bloqueio vale de verdade nos pontos de checagem',()=>{
 const {s,order,asset,client}=fixture(),T=s.users.find(x=>x.id==='tech'),A=s.users.find(x=>x.id==='att');
 const quote=(u,extra={})=>run(s,'quote',{order,items:[{component:asset,description:'Item',qty:1,price:50,cost:20,warranty:5}],discount:0,...extra},u);
 // editar orçamento
 T.perms={editarOrcamento:false};assert.throws(()=>quote(T),/Sem permissão para editar orçamentos/);delete T.perms;quote(T);
 // custo: quem não vê custo não define custo e não recebe custo
 assert.equal(s.orders[0].items[0].cost,0);T.perms={verCustos:true};quote(T);assert.equal(s.orders[0].items[0].cost,20);assert.ok(JSON.stringify(visibleState(s,T).orders[0].items).includes('"cost"'));
 A.perms={verCustos:false};assert.ok(!JSON.stringify(visibleState(s,A)).includes('"cost"'),'atendente sem custo não recebe custo em lugar nenhum');assert.equal(visibleState(s,A).orders.length,s.orders.length);
 delete A.perms;assert.ok(JSON.stringify(visibleState(s,A)).includes('"cost"'));
 // desconto e decisão
 delete T.perms;assert.throws(()=>quote(T,{discount:10}),/desconto é definido pelo atendimento/);T.perms={decidirOrcamento:true};quote(T,{discount:10});assert.equal(s.orders[0].discount,10);
 const decide=u=>run(s,'decision',{order,component:asset,decision:'Aprovado',channel:'Presencial'},u);
 delete T.perms;assert.throws(()=>decide(T),/não registra decisão comercial/);T.perms={decidirOrcamento:true};decide(T);
 A.perms={decidirOrcamento:false};assert.throws(()=>decide(A),/não registra decisão comercial/);delete A.perms;decide(A);
 // tabela de preços
 const price=u=>run(s,'price',{name:'P'+Math.random(),category:'Serviço',price:1},u);
 assert.throws(()=>price(A),/tabela de preços/);A.perms={gerenciarPrecos:true};price(A);delete A.perms;
 // clientes
 const cu=u=>run(s,'client_update',{client,name:'N',phone:'1'},u);
 A.perms={gerenciarClientes:false};assert.throws(()=>cu(A),/editar clientes/);assert.throws(()=>run(s,'order',{newClient:{name:'Z',phone:'1'},kind:'Mineradora',model:'M',serial:'PERM-1',issue:'x',priority:'Normal',completeness:'Completa'},A),/cadastrar clientes/);
 T.perms={gerenciarClientes:true};assert.throws(()=>cu(T),/atendimento ou administração/,'liberar a permissão não dá acesso ao que o perfil nunca tem');delete T.perms;delete A.perms;cu(A);
 // painel
 assert.throws(()=>run(s,'panel',{client,enabled:true},A),/painel do cliente/);A.perms={gerenciarPainel:true};run(s,'panel',{client,enabled:true},A);delete A.perms;
 // pagamentos e estoque (fluxo legado)
 const pay=u=>mutate(s,u,'payment',{id:s.orders[0].id,amount:1,method:'Pix'});
 T.perms={registrarPagamentos:true};pay(T);delete T.perms;assert.throws(()=>pay(T),/perfil não permite/);A.perms={registrarPagamentos:false};assert.throws(()=>pay(A),/perfil não permite/);delete A.perms;pay(A);
 const part=(u,c)=>mutate(s,u,'part',{name:'Peça',code:c,cost:1,price:2,stock:1,minimum:0});
 assert.throws(()=>part(A,'PX1'),/Apenas administrador/);A.perms={gerenciarEstoque:true};part(A,'PX1');assert.throws(()=>part(A,'PX1'),/já cadastrado/);
 // peças: custo some para quem não vê custo
 delete A.perms;A.perms={verCustos:false};assert.ok(!JSON.stringify(visibleState(s,A).parts).includes('"cost"'));T.perms={verCustos:true};assert.ok(JSON.stringify(visibleState(s,T).parts).includes('"cost"'));delete T.perms;assert.ok(!JSON.stringify(visibleState(s,T).parts).includes('"cost"'));
});
