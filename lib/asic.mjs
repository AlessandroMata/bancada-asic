// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
// Domain extension. All writes pass through the same optimistic SQL transaction.
import {mutate as legacyMutate} from './domain.mjs';
import {can,cleanOverrides,PERMS,CUSTOMIZABLE} from './perms.mjs';
export const collections=['assets','assetEvents','lots','routines','diagnostics','defects','benches','bookings','sessions','firmwares','articles','returns','donors','recoveries','shipments','contracts','visits','viabilities','priceItems','audit'];
export function upgrade(s){for(const k of collections)s[k]??=[];s.versionASIC=1;return s}
export const terminal=o=>['Entregue','Cancelado'].includes(o.status);
export const localDay=(value=new Date().toISOString())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date(value));
export function applyContract(s,o,now=new Date().toISOString()){const today=localDay(now);const c=s.contracts.filter(c=>c.client===o.client&&c.start<=today&&c.end>=today).sort((a,b)=>b.created.localeCompare(a.created))[0];if(c){o.contract=c.id;o.slaDue=new Date(Date.parse(now)+c.slaHours*3600000).toISOString();if(!o.due)o.due=localDay(o.slaDue);if(o.priority==='Normal')o.priority=c.priority}}
export const oscode=o=>'OS-'+String(o.number).padStart(4,'0');
const err=m=>{throw Error(m)};
const text=(v,label,optional=false,max=12000)=>{if(v==null&&optional)return '';if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))err('Informe '+label);return v.trim()};
const number=(v,label,min=0,max=1e9)=>{if(v===''||v==null)err('Informe '+label);const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)err(label+' inválido');return n};
const pick=(v,options,label)=>{if(!options.includes(v))err(label+' inválido');return v};
const dt=(v,label)=>{const value=typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)?v+':00-03:00':v;if(!value||!Number.isFinite(Date.parse(value)))err(label+' inválida');return new Date(value).toISOString()};
const day=v=>{if(!v)return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v)))err('Data inválida');return v};
const found=(s,k,id)=>s[k].find(x=>x.id===id)||err('Registro não encontrado: '+k);
const round=n=>Math.round(n*100)/100;
// Check-in do equipamento: completo, ou incompleto com a lista do que falta.
export const MISSING_ITEMS=['Hashboard','Fonte de alimentação','Controladora','Ventoinha','Cabos e chicotes','Carcaça / estrutura','Dissipadores','Parafusos e fixações'];
export function intakeFrom(p,by,at){
 const complete=pick(p.completeness,['Completa','Incompleta'],'Estado de entrega')==='Completa';if(complete)return {complete:true,missing:[],note:'',by,at};
 const list=Array.isArray(p.missing)?p.missing:String(p.missing||'').split(',').map(x=>x.trim()).filter(Boolean),missing=[...new Set(list)];
 for(const m of missing)if(!MISSING_ITEMS.includes(m))err('Item faltante inválido: '+m);
 const note=text(p.missingNote,'o que falta',true,500);if(!missing.length&&!note)err('Informe o que está faltando ou marque “Completa”');
 return {complete:false,missing,note,by,at};
}
// Número de série: obrigatório e real, ou a opção explícita "Ilegível". Recusa preenchimentos como "sem", "n/a", "0000" ou "aaaa".
const SERIAL_MSG='Informe o número de série real ou marque “Ilegível”';
export function serialText(v){const s=String(v??'').trim().replace(/\s+/g,' ');if(s.length<2||s.length>64||!/^[A-Za-z0-9][A-Za-z0-9 ._\/-]*$/.test(s)||/^(n\/?a|na|sem|nenhum|n[aã]o tem|desconhecido|ileg[ií]vel|-+|\.+|0+|x+)$/i.test(s)||/^(.)\1+$/.test(s))throw Error(SERIAL_MSG);return s}
export const isIllegible=v=>v===true||v==='Sim'||v==='on'||v==='true';
const goodAssets=['Mineradora','Hashboard','Fonte','Controladora'];
export function canOrder(u,o){return !!o&&u.role!=='Desativado'&&(u.role==='Administrador'||u.role==='Atendente'||u.role==='Técnico'&&o.tech===u.id||u.role==='Cliente'&&o.client===u.client)}
export function canScope(s,u,scope,id){if(scope==='order')return canOrder(u,s.orders.find(o=>o.id===id));if(u.role==='Cliente')return false;if(scope==='asset'){const a=s.assets.find(a=>a.id===id);return !!a&&(u.role!=='Técnico'||s.orders.some(o=>o.tech===u.id&&o.assetIds?.includes(a.id)))}if(scope==='lot')return u.role==='Administrador'||u.role==='Atendente';return false}
export function evaluateTest(session,metrics,ended){
 const c=session.criteria;const duration=(new Date(ended)-new Date(session.started))/60000;
 return [
 ['Duração (min)',duration,c.minDuration,duration>=c.minDuration],
 ['Hashrate (TH/s)',metrics.hashrate,c.minHash,metrics.hashrate>=c.minHash],
 ['Temperatura máxima (°C)',metrics.temperature,c.maxTemp,metrics.temperature<=c.maxTemp],
 ['Consumo (W)',metrics.power,c.maxPower,metrics.power<=c.maxPower],
 ['Erros',metrics.errors,c.maxErrors,metrics.errors<=c.maxErrors],
 ...(c.expectedChips?[['Chips reconhecidos',metrics.chips,c.expectedChips,metrics.chips===c.expectedChips]]:[])
 ].map(([label,actual,limit,pass])=>({label,actual,limit,pass}));
}
export function beforeLegacy(s,u,action,p){
 upgrade(s);if(u.role==='Cliente')err('Use as operações autorizadas do portal');
 if(action==='update'&&['Pronto para retirada','Entregue'].includes(p.status)){
 const o=found(s,'orders',p.id);if(!canOrder(u,o))err('Sem acesso à OS');
 if(o.items.some(i=>i.component&&(!i.decision||i.decision==='Pendente')))err('Há componentes aguardando decisão do orçamento');
 const accepted=new Set(o.items.filter(i=>i.component&&i.decision==='Aprovado').map(i=>i.component));
 for(const id of accepted){const a=found(s,'assets',id);if(a.status!=='Testado')err('Componente aprovado ainda não está testado: '+a.code);const tests=s.sessions.filter(t=>t.order===o.id&&t.asset===id&&t.phase==='Depois').sort((a,b)=>b.created.localeCompare(a.created));if(!tests[0]||tests[0].status!=='Aprovado')err('Falta teste final aprovado de '+a.code)}
 }
 if(action==='order')err('Abra a OS a partir de um equipamento ASIC (Nova OS)');
 if(action==='approve'||action==='quote')err('Use o orçamento e as decisões por componente');
}
export function asicMutate(s,u,action,p){
 upgrade(s);if(!action.startsWith('asic_'))return false;
 const kind=action.slice(5),now=new Date().toISOString(),uid=()=>crypto.randomUUID(),admin=u.role==='Administrador',front=admin||u.role==='Atendente',tech=u.role==='Técnico',customer=u.role==='Cliente';
 if(!['Administrador','Atendente','Técnico','Cliente'].includes(u.role))err('Sem permissão');
 if(customer&&kind!=='decision')err('Operação exclusiva da assistência');
 const staff=()=>{if(!front)err('Operação exige atendimento ou administração')};
 const boss=()=>{if(!admin)err('Operação exige administrador')};
 const need=(k,msg)=>{if(!can(u,k))err(msg)};
 const order=(id=p.order,open=true)=>{const o=found(s,'orders',id);if(!canOrder(u,o))err('OS não atribuída a você');if(open&&terminal(o))err('OS encerrada');return o};
 const asset=(id=p.asset)=>{const a=found(s,'assets',id);if(tech&&!s.orders.some(o=>o.tech===u.id&&o.assetIds?.includes(id)))err('Componente não atribuído a você');return a};
 const audit=(message,orderId,assetId)=>{const e={id:uid(),at:now,user:u.name,userId:u.id,message,order:orderId||null,asset:assetId||null};s.audit.push(e);if(orderId){const o=found(s,'orders',orderId);o.history.push({at:now,user:u.name,message})}return e};
 const add=(k,r)=>{const rec={id:uid(),created:now,by:u.name,...r};s[k].push(rec);return rec};
 const forOrder=(o,a)=>{if(!o.assetIds?.includes(a.id))err('Vincule este componente à OS antes de registrar dados técnicos')};
 const makeAsset=p=>{
 found(s,'clients',p.client);const k=pick(p.kind,goodAssets,'Tipo');
 const code='ASIC-'+String(s.assets.length+1).padStart(5,'0'),illegible=isIllegible(p.serialIllegible),serial=illegible?'ILEGÍVEL-'+code:serialText(p.serial);if(s.assets.some(a=>a.serial.toLowerCase()===serial.toLowerCase()))err('Número de série já cadastrado');
 let parent=null;if(p.parent){parent=found(s,'assets',p.parent);if(parent.kind!=='Mineradora'||parent.client!==p.client||k==='Mineradora')err('Equipamento principal incompatível')}
 const a=add('assets',{code,serialIllegible:illegible,kind:k,client:p.client,parent:parent?.id||null,model:text(p.model,'o modelo'),brand:text(p.brand,'a marca',true),revision:text(p.revision,'a revisão',true),serial,status:'Recebido',location:text(p.location,'a localização',true),notes:text(p.notes,'as observações',true),expectedHash:p.expectedHash?number(p.expectedHash,'Hashrate'):null,expectedPower:p.expectedPower?number(p.expectedPower,'Consumo'):null,attachments:[]});
 s.assetEvents.push({...audit('Cadastro '+a.code,null,a.id),from:null,to:parent?.id||null,reason:'Recebimento'});return a;
 };
 if(kind==='asset'){staff();makeAsset(p)}
 else if(kind==='order'){
 staff();const intake=intakeFrom(p,u.name,now);
 if(!p.client&&p.newClient){need('gerenciarClientes','Sem permissão para cadastrar clientes');legacyMutate(s,u,'client',{name:p.newClient.name,phone:p.newClient.phone,email:p.newClient.email||'',document:p.newClient.document||''});p={...p,client:s.clients[s.clients.length-1].id};audit('Cliente cadastrado na abertura da OS: '+s.clients[s.clients.length-1].name)}
 found(s,'clients',p.client);let a;if(!p.asset&&!p.kind)err('Escolha um equipamento cadastrado ou informe os dados de um novo');
 if(p.asset){a=found(s,'assets',p.asset);if(a.client!==p.client)err('Equipamento pertence a outro cliente')}else a=makeAsset({...p,parent:''});
 const members=[a.id,...s.assets.filter(c=>c.parent===a.id).map(c=>c.id)];if(members.some(id=>s.orders.some(o=>!terminal(o)&&o.assetIds?.includes(id))))err('Equipamento já está em outra OS aberta');
 legacyMutate(s,u,'order',{client:p.client,issue:p.issue,priority:p.priority,tech:p.tech||'',due:day(p.due),checklist:p.checklist||'',accessories:p.accessories||'',parent:p.parent||null});const o=s.orders[s.orders.length-1];o.assetIds=members;o.intake=intake;applyContract(s,o,now);audit('OS aberta para '+a.code+' ('+(intake.complete?'entrada completa':'entrada incompleta')+')',o.id,a.id);
 }
 else if(kind==='asset_serial'){
 staff();const a=found(s,'assets',p.asset),illegible=isIllegible(p.serialIllegible),serial=illegible?'ILEGÍVEL-'+a.code:serialText(p.serial);
 if(s.assets.some(x=>x.id!==a.id&&x.serial.toLowerCase()===serial.toLowerCase()))err('Número de série já cadastrado');
 const reason=a.serialIllegible?text(p.reason,'o motivo da correção',true):text(p.reason,'o motivo da correção'),old=a.serial;
 a.serial=serial;a.serialIllegible=illegible;audit('Número de série alterado: '+old+' → '+serial+(reason?' ('+reason+')':''),null,a.id);
 }
 else if(kind==='asset_update'){
 const a=asset();if(customer)err('Sem permissão');if(p.order){const o=order();forOrder(o,a)}else if(tech)err('Selecione uma OS')
 a.status=pick(p.status,['Recebido','Triagem','Diagnóstico','Aguardando aprovação','Aguardando componentes','Reparo','Testado','Substituído','Condenado','Devolvido sem reparo','Entregue'],'Estado');a.location=text(p.location,'a localização',true);a.notes=text(p.notes,'as observações',true);audit('Estado do componente: '+a.status,p.order||null,a.id);
 }
 else if(kind==='transfer'){
 staff();const a=asset();if(a.kind==='Mineradora')err('Transfira apenas componentes');const target=p.target?found(s,'assets',p.target):null;
 if(target&&(target.kind!=='Mineradora'||target.client!==a.client))err('A transferência deve ser entre mineradoras do mesmo cliente');
 if(a.parent===(target?.id||null))err('O destino já é o atual');const from=a.parent;a.parent=target?.id||null;
 s.assetEvents.push({...audit('Transferência de '+a.code,null,a.id),from,to:a.parent,temporary:p.temporary===true||p.temporary==='Sim',reason:text(p.reason,'o motivo')});
 }
 else if(kind==='link_order'){
 staff();const o=order();const ids=Array.from(new Set(p.assets||[]));if(!ids.length)err('Selecione componentes');for(const id of ids){const a=found(s,'assets',id);if(a.client!==o.client)err('Equipamento pertence a outro cliente');if(s.orders.some(x=>x.id!==o.id&&!terminal(x)&&x.assetIds?.includes(id)))err('Equipamento já está em outra OS aberta')}
 if(o.items.some(i=>i.component&&!ids.includes(i.component)))err('O orçamento usa um componente que você está removendo');o.assetIds=ids;audit('Componentes vinculados à OS',o.id);
 }
 else if(kind==='lot'){
 staff();found(s,'clients',p.client);const ids=Array.from(new Set(p.assets||[]));if(ids.some(id=>found(s,'assets',id).client!==p.client))err('Lote contém equipamentos de outro cliente');if(ids.some(id=>s.lots.some(l=>l.assets.includes(id)&&!l.closed)))err('Equipamento já está em um lote aberto');
 const expected=number(p.expected,'Quantidade esperada',1,10000);if(!Number.isInteger(expected)||ids.length>expected)err('Quantidade conferida maior que a esperada');
 add('lots',{code:'LOTE-'+String(s.lots.length+1).padStart(4,'0'),client:p.client,name:text(p.name,'a remessa'),expected,assets:ids,notes:text(p.notes,'a conferência',true),received:day(p.received)||localDay(now),closed:false,attachments:[]});audit('Recebimento de lote');
 }
 else if(kind==='lot_update'){
 staff();const l=found(s,'lots',p.lot);if(l.closed)err('Lote já encerrado');const ids=Array.from(new Set(p.assets||[]));if(ids.length>l.expected||ids.some(id=>found(s,'assets',id).client!==l.client))err('Conferência inválida');if(ids.some(id=>s.lots.some(x=>x.id!==l.id&&!x.closed&&x.assets.includes(id))))err('Equipamento em outro lote');l.assets=ids;l.notes=text(p.notes,'a conferência',true);if(p.closed===true){if(s.orders.some(o=>!terminal(o)&&o.assetIds?.some(id=>ids.includes(id))))err('Há OS abertas no lote');if(ids.length!==l.expected)err('Conclua a conferência antes de encerrar');l.closed=true}audit('Conferência de lote '+l.code);
 }
 else if(kind==='lot_orders'){
 staff();const l=found(s,'lots',p.lot);if(l.closed)err('Lote encerrado');const chosen=l.assets.filter(id=>{const a=found(s,'assets',id);return !a.parent||!l.assets.includes(a.parent)});if(!chosen.length)err('Confira os equipamentos do lote');if(chosen.length>100)err('Divida a abertura em lotes de até 100 unidades');
 const issue=text(p.issue,'o defeito / serviço inicial'),priority=pick(p.priority,['Baixa','Normal','Alta','Urgente'],'Prioridade');let count=0;
 for(const id of chosen){const a=found(s,'assets',id);if(s.orders.some(o=>!terminal(o)&&o.assetIds?.includes(id)))continue;const members=[id,...s.assets.filter(c=>c.parent===id).map(c=>c.id)];if(members.some(id=>s.orders.some(o=>!terminal(o)&&o.assetIds?.includes(id))))err('Há um componente desta mineradora em outra OS aberta');legacyMutate(s,u,'order',{client:l.client,issue,priority,tech:p.tech||'',due:day(p.due),checklist:l.notes,accessories:''});const o=s.orders[s.orders.length-1];o.assetIds=members;o.lot=l.id;applyContract(s,o,now);audit('OS individual gerada a partir de '+l.code,o.id,id);count++}if(!count)err('Todos os equipamentos já têm OS aberta');
 }
 else if(kind==='routine'){
 boss();const criteria={minHash:number(p.minHash,'Hashrate mínimo'),maxTemp:number(p.maxTemp,'Temperatura máxima'),maxPower:number(p.maxPower,'Potência máxima'),maxErrors:number(p.maxErrors,'Erros máximos'),minDuration:number(p.minDuration,'Duração mínima',1,100000),expectedChips:p.expectedChips?number(p.expectedChips,'Chips esperados',1,10000):null};
 const steps=text(p.steps,'as etapas').split('\n').map(v=>v.trim()).filter(Boolean);if(!steps.length)err('Informe etapas');add('routines',{name:text(p.name,'o roteiro'),model:text(p.model,'o modelo'),revision:text(p.revision,'a revisão'),version:text(p.version,'a versão'),source:text(p.source,'a fonte do procedimento'),steps,criteria});audit('Roteiro técnico versionado');
 }
 else if(kind==='diagnostic'){
 const o=order(),a=asset();forOrder(o,a);const r=found(s,'routines',p.routine);if(r.model.toLowerCase()!==a.model.toLowerCase()||r.revision.toLowerCase()!==a.revision.toLowerCase())err('Roteiro incompatível com modelo ou revisão');
 const checks=r.steps.map((step,i)=>({step,result:pick(p.checks?.[i],['Conforme','Falha','Não aplicável'],'Resultado do checklist')}));
 add('diagnostics',{order:o.id,asset:a.id,routine:r.id,routineSnapshot:structuredClone(r),checks,findings:text(p.findings,'o diagnóstico'),measurements:text(p.measurements,'as medições',true),logs:text(p.logs,'os logs',true),oxidation:pick(p.oxidation,['Sim','Não'],'Oxidação'),dust:pick(p.dust,['Baixa','Moderada','Alta'],'Poeira'),connectors:text(p.connectors,'os conectores',true),fans:p.fans?number(p.fans,'Ventoinhas',0,100):null,boards:p.boards?number(p.boards,'Placas detectadas',0,100):null,chips:p.chips?number(p.chips,'Chips detectados',0,10000):null});audit('Diagnóstico registrado para '+a.code,o.id,a.id);
 }
 else if(kind==='defect'){
 const o=order(),a=asset();forOrder(o,a);if(a.kind!=='Hashboard')err('Mapa de defeitos exige uma hashboard');
 add('defects',{order:o.id,asset:a.id,x:number(p.x,'Coordenada X',0,100),y:number(p.y,'Coordenada Y',0,100),component:text(p.component,'o componente / ponto'),reading:text(p.reading,'a medição'),solution:text(p.solution,'a solução'),replaced:text(p.replaced,'a peça substituída',true)});audit('Ponto de defeito: '+p.component,o.id,a.id);
 }
 else if(kind==='bench'){
 boss();add('benches',{name:text(p.name,'a bancada ou instrumento'),type:pick(p.type,['Bancada','Instrumento'],'Tipo'),serial:text(p.serial,'a identificação'),location:text(p.location,'a localização'),calibrationRequired:p.calibrationRequired==='Sim',calibrationDue:day(p.calibrationDue),active:true});audit('Cadastro de recurso de bancada');
 }
 else if(kind==='booking'){
 const o=order(),b=found(s,'benches',p.bench),start=dt(p.start,'Início'),end=dt(p.end,'Fim');if(end<=start)err('Fim deve ser posterior ao início');
 if(b.calibrationRequired&&(!b.calibrationDue||b.calibrationDue<localDay(end)))err('Calibração ausente ou vencida no período');
 if(s.bookings.some(x=>x.bench===b.id&&!x.cancelled&&x.start<end&&x.end>start))err('Recurso já reservado neste horário');add('bookings',{order:o.id,bench:b.id,start,end,technician:u.id,cancelled:false});audit('Reserva de bancada / instrumento',o.id);
 }
 else if(kind==='bench_calibrate'){boss();const b=found(s,'benches',p.bench);const due=day(p.calibrationDue);if(!due||due<localDay(now))err('Informe uma validade vigente');b.calibrationDue=due;b.calibrationReference=text(p.reference,'a referência da calibração');audit('Calibração registrada: '+b.name)}
 else if(kind==='booking_cancel'){const b=found(s,'bookings',p.booking);order(b.order);if(s.sessions.some(t=>t.booking===b.id&&t.status==='Em execução'))err('Encerre o teste antes de liberar a bancada');b.cancelled=true;audit('Reserva liberada',b.order)}
 else if(kind==='session_start'){
 const o=order(),a=asset();forOrder(o,a);const r=found(s,'routines',p.routine),b=found(s,'bookings',p.booking);if(r.model.toLowerCase()!==a.model.toLowerCase()||r.revision.toLowerCase()!==a.revision.toLowerCase())err('Critérios incompatíveis com modelo ou revisão');if(found(s,'benches',b.bench).type!=='Bancada')err('Selecione uma reserva de bancada');if(b.order!==o.id||b.cancelled)err('Reserva não pertence à OS');if(now<b.start||now>b.end)err('Teste deve iniciar dentro do horário reservado');if(s.sessions.some(t=>t.asset===a.id&&t.status==='Em execução'))err('Componente já está em teste');
 const instrumentIds=p.instruments||[];for(const id of instrumentIds){const i=found(s,'benches',id);if(i.type!=='Instrumento')err('Instrumento inválido');if(i.calibrationRequired&&(!i.calibrationDue||i.calibrationDue<localDay(now)))err('Instrumento com calibração vencida');if(!s.bookings.some(x=>x.bench===id&&x.order===o.id&&!x.cancelled&&x.start<=now&&x.end>=b.end))err('Reserve cada instrumento por toda a sessão')}
 add('sessions',{order:o.id,asset:a.id,routine:r.id,criteria:structuredClone(r.criteria),routineVersion:r.version,booking:b.id,instruments:instrumentIds,phase:pick(p.phase,['Antes','Depois'],'Fase'),started:now,status:'Em execução',firmware:text(p.firmware,'o firmware'),configuration:text(p.configuration,'a configuração'),conditions:text(p.conditions,'as condições de operação'),samples:[]});audit('Teste iniciado • '+a.code,o.id,a.id);
 }
 else if(kind==='sample'){
 const t=found(s,'sessions',p.session);order(t.order);if(t.status!=='Em execução')err('Teste encerrado');const metrics={hashrate:number(p.hashrate,'Hashrate'),temperature:number(p.temperature,'Temperatura',-50,300),power:number(p.power,'Potência'),errors:number(p.errors,'Erros'),chips:p.chips?number(p.chips,'Chips',0,10000):null};t.samples.push({id:uid(),at:now,...metrics,note:text(p.note,'a observação',true)});audit('Medição de teste registrada',t.order,t.asset);
 }
 else if(kind==='session_finish'){
 const t=found(s,'sessions',p.session),o=order(t.order);if(t.status!=='Em execução')err('Teste já encerrado');t.reason=text(p.reason,'o motivo do encerramento');t.ended=now;
 if(p.interrupted==='Sim'){t.status='Interrompido';t.results=[]}else{if(!t.samples.length)err('Registre medições antes de concluir');if(!o.attachments.some(a=>a.category==='Evidência de teste'&&a.at>=t.started))err('Anexe evidência do teste à OS');const aggregate={hashrate:Math.min(...t.samples.map(s=>s.hashrate)),temperature:Math.max(...t.samples.map(s=>s.temperature)),power:Math.max(...t.samples.map(s=>s.power)),errors:Math.max(...t.samples.map(s=>s.errors)),chips:Math.min(...t.samples.map(s=>s.chips??0))};t.results=evaluateTest(t,aggregate,now);t.status=t.results.every(r=>r.pass)?'Aprovado':'Reprovado';if(t.phase==='Depois')found(s,'assets',t.asset).status=t.status==='Aprovado'?'Testado':'Reparo'}audit('Teste encerrado: '+t.status,t.order,t.asset);
 }
 else if(kind==='firmware'){
 const o=order(),a=asset();forOrder(o,a);const backup=p.backup?o.attachments.find(x=>x.id===p.backup&&x.category==='Backup'):null;if(p.backup&&!backup)err('Backup inválido');
 add('firmwares',{order:o.id,asset:a.id,received:text(p.received,'a versão recebida'),delivered:text(p.delivered,'a versão entregue'),changes:text(p.changes,'as alterações'),configuration:text(p.configuration,'a configuração sem senhas'),consent:text(p.consent,'a autorização do cliente'),channel:text(p.channel,'o canal de autorização'),backup:backup?.id||null});audit('Firmware / configuração documentado',o.id,a.id);
 }
 else if(kind==='article'){
 const o=order(p.order,false);if(o.status!=='Entregue')err('A base de conhecimento exige um reparo concluído');const a=asset();forOrder(o,a);
 add('articles',{order:o.id,title:text(p.title,'o título'),model:a.model,revision:a.revision,symptom:o.issue,diagnosis:o.diagnosis,solution:text(p.solution,'a solução validada'),result:text(p.result,'o resultado dos testes'),tags:text(p.tags,'as palavras-chave',true)});audit('Caso convertido em artigo',o.id,a.id);
 }
 else if(kind==='return'){
 staff();const original=order(p.original,false);if(original.status!=='Entregue')err('Retorno exige uma OS entregue');const a=asset();forOrder(original,a);const o=order();if(o.client!==original.client||o.id===original.id)err('OS de retorno inválida');forOrder(o,a);o.parent=original.id;
 const days=original.items.filter(i=>i.component===a.id&&i.decision==='Aprovado').reduce((v,i)=>Math.max(v,i.warranty??original.warranty),0)||original.warranty;const deadline=original.delivered?new Date(Date.parse(original.delivered)+days*86400000).toISOString():null;
 add('returns',{order:o.id,original:original.id,asset:a.id,classification:pick(p.classification,['Mesmo defeito','Falha diferente','Problema não reproduzido'],'Classificação'),reason:text(p.reason,'a análise do retorno'),warrantyDays:days,deadline,withinWindow:deadline?now<=deadline:false,covered:p.covered==='Sim'});audit('Retorno classificado: '+p.classification,o.id,a.id);
 }
 else if(kind==='donor'){
 staff();const a=asset();add('donors',{asset:a.id,name:text(p.name,'a placa doadora'),release:text(p.release,'a autorização de propriedade / descarte'),supplier:text(p.supplier,'a origem'),notes:text(p.notes,'o estado',true)});audit('Placa doadora registrada',null,a.id);
 }
 else if(kind==='recover'){
 if(!front&&!tech)err('Sem permissão');const d=found(s,'donors',p.donor);if(tech)asset(d.asset);const qty=number(p.qty,'Quantidade',1,100000);if(!Number.isInteger(qty))err('Quantidade deve ser inteira');const r=add('recoveries',{donor:d.id,code:text(p.code,'o código do componente'),model:text(p.model,'a compatibilidade / revisão'),qty,available:qty,result:text(p.result,'o teste do componente'),lot:text(p.lot,'o lote'),location:text(p.location,'a localização'),condition:'Reaproveitado',uses:[]});audit('Componente recuperado: '+r.code,null,d.asset);
 }
 else if(kind==='use_recovery'){
 const o=order(),a=asset();forOrder(o,a);const r=found(s,'recoveries',p.recovery),qty=number(p.qty,'Quantidade',1,100000);if(!Number.isInteger(qty)||qty>r.available)err('Quantidade indisponível');const consent=text(p.consent,'a autorização do cliente para peça reaproveitada');r.available-=qty;r.uses.push({id:uid(),order:o.id,destination:a.id,qty,consent,at:now,user:u.name});audit('Peça reaproveitada utilizada: '+r.code,o.id,a.id);
 }
 else if(kind==='part_meta'){
 boss();const part=found(s,'parts',p.part);for(const k of ['compatibility','lot','supplier','location'])part[k]=text(p[k],k,true);part.condition=pick(p.condition,['Nova','Usada testada'],'Condição');audit('Rastreabilidade de peça atualizada');
 }
 else if(kind==='viability'){
 staff();const o=order();const repair=number(p.repair,'Custo do reparo'),replacement=number(p.replacement,'Custo da substituição'),value=number(p.value,'Valor informado do equipamento'),dailyNet=number(p.dailyNet,'Resultado diário estimado',-1e6,1e6),days=number(p.days,'Prazo estimado',0,3650);add('viabilities',{order:o.id,repair,replacement,value,dailyNet,days,assumptions:text(p.assumptions,'as premissas e a data-base'),decision:pick(p.decision,['Reparar','Substituir','Devolver','Aguardar'],'Alternativa'),breakEven:dailyNet>0?round(repair/dailyNet):null,estimatedDowntimeCost:round(Math.max(0,dailyNet)*days)});audit('Análise de viabilidade documentada',o.id);
 }
 else if(kind==='shipment'){
 staff();const lot=found(s,'lots',p.lot);const ids=Array.from(new Set(p.assets||[]));if(!ids.length||ids.some(id=>!lot.assets.includes(id)))err('Selecione equipamentos deste lote');if(ids.some(id=>s.shipments.some(sh=>sh.assets.includes(id)&&sh.status!=='Entregue'&&sh.status!=='Cancelado')))err('Equipamento já está em outra remessa ativa');for(const id of ids){const a=found(s,'assets',id);if(!['Testado','Substituído','Condenado','Devolvido sem reparo','Entregue'].includes(a.status))err('Equipamento não liberado: '+a.code);const os=s.orders.filter(o=>o.assetIds?.includes(id));if(!os.length||os.some(o=>!['Pronto para retirada','Entregue','Cancelado'].includes(o.status)))err('Finalize o atendimento antes de despachar');if(os.some(o=>o.payments.reduce((v,x)=>v+x.amount,0)<o.items.filter(i=>i.decision!=='Recusado').reduce((v,i)=>v+i.qty*i.price,0)-o.discount))err('Há saldo pendente do equipamento')}
 add('shipments',{lot:lot.id,client:lot.client,assets:ids,status:'Preparando',packaging:text(p.packaging,'a embalagem'),weight:number(p.weight,'Peso em kg',0.01,100000),carrier:text(p.carrier,'a transportadora'),tracking:text(p.tracking,'o rastreamento',true),insurance:number(p.insurance,'Seguro'),notes:text(p.notes,'as observações',true),attachments:[],history:[]});audit('Remessa parcial / total preparada');
 }
 else if(kind==='shipment_update'){
 staff();const sh=found(s,'shipments',p.shipment);const st=pick(p.status,['Preparando','Despachado','Entregue','Cancelado'],'Etapa');const allowed={Preparando:['Despachado','Cancelado'],Despachado:['Entregue'],Entregue:[],Cancelado:[]};if(!allowed[sh.status].includes(st))err('Transição de transporte inválida');const lot=found(s,'lots',sh.lot);if(st==='Despachado'&&!lot.attachments.some(a=>a.category==='Embalagem'))err('Anexe fotos de embalagem ao lote');if(st==='Entregue'&&!lot.attachments.some(a=>a.category==='Comprovante'))err('Anexe o comprovante de entrega ao lote');sh.status=st;sh.history.push({at:now,user:u.name,status:st,note:text(p.note,'a observação',true)});audit('Transporte atualizado: '+st);
 }
 else if(kind==='contract'){
 boss();found(s,'clients',p.client);const start=day(p.start),end=day(p.end);if(!start||!end||end<start)err('Vigência inválida');add('contracts',{client:p.client,name:text(p.name,'o contrato'),start,end,slaHours:number(p.slaHours,'SLA em horas',1,100000),priority:pick(p.priority,['Baixa','Normal','Alta','Urgente'],'Prioridade'),approvalLimit:number(p.approvalLimit,'Limite de aprovação'),approvers:text(p.approvers,'os aprovadores').split(/[;,\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean),terms:text(p.terms,'as condições comerciais'),preventiveDays:number(p.preventiveDays,'Intervalo preventivo em dias',1,3650)});audit('Contrato cadastrado');
 }
 else if(kind==='visit'){
 staff();const c=found(s,'contracts',p.contract);const technician=found(s,'users',p.technician);if(technician.role!=='Técnico')err('Selecione um técnico');const scheduled=dt(p.scheduled,'Agendamento');if(localDay(scheduled)<c.start||localDay(scheduled)>c.end)err('Agendamento fora da vigência');add('visits',{contract:c.id,client:c.client,technician:p.technician,scheduled,location:text(p.location,'o local'),task:text(p.task,'o serviço'),type:pick(p.type,['Preventiva','Atendimento em campo'],'Tipo'),status:'Agendado',report:'',nextDate:null});audit('Atendimento agendado');
 }
 else if(kind==='visit_finish'){
 const v=found(s,'visits',p.visit);if(tech&&v.technician!==u.id)err('Atendimento não atribuído');if(v.status!=='Agendado')err('Atendimento já concluído');v.report=text(p.report,'o relatório');v.status='Concluído';v.completed=now;const contract=found(s,'contracts',v.contract);v.nextDate=v.type==='Preventiva'?new Date(Math.max(Date.parse(v.scheduled),Date.now())+contract.preventiveDays*86400000).toISOString():null;if(v.nextDate&&localDay(v.nextDate)<=contract.end)add('visits',{contract:v.contract,client:v.client,technician:v.technician,scheduled:v.nextDate,location:v.location,task:v.task,type:'Preventiva',status:'Agendado',report:'',nextDate:null,previous:v.id});audit('Atendimento concluído');
 }
 else if(kind==='panel'){
 need('gerenciarPainel','Sem permissão para o painel do cliente');const c=found(s,'clients',p.client),fresh=()=>{let code;do code=newPanelCode();while(s.clients.some(x=>x.panelCode===code));return code};
 if(p.regenerate===true){c.panelCode=fresh();audit('Novo código do painel: '+c.name)}
 else if(typeof p.enabled==='boolean'){c.panelEnabled=p.enabled;if(p.enabled&&!c.panelCode)c.panelCode=fresh();audit('Painel do cliente '+(p.enabled?'ativado':'desativado')+': '+c.name)}
 else err('Operação do painel inválida');
 }
 else if(kind==='price'||kind==='price_update'){
 need('gerenciarPrecos','Sem permissão para a tabela de preços');const pi=kind==='price_update'?found(s,'priceItems',p.item):null,name=text(p.name,'a descrição',false,200),category=pick(p.category,['Serviço','Peça'],'Categoria');
 if(s.priceItems.some(x=>x.id!==pi?.id&&x.category===category&&x.name.toLowerCase()===name.toLowerCase()))err('Já existe este item na tabela');
 const f={name,category,price:number(p.price,'Preço',0,1e7),cost:number(p.cost===''||p.cost==null?0:p.cost,'Custo',0,1e7),warranty:number(p.warranty===''||p.warranty==null?0:p.warranty,'Garantia',0,3650),models:text(p.models,'os modelos',true,500)};
 if(pi){Object.assign(pi,f,{active:p.active!==false&&p.active!=='Não'});audit('Tabela de preços atualizada: '+name)}else{add('priceItems',{...f,active:true});audit('Item da tabela de preços: '+name)}
 }
 else if(kind==='comment'){
 const o=order(p.order,false),visible=p.visible===true||p.visible==='Sim';o.comments??=[];
 o.comments.push({id:uid(),at:now,user:u.name,userId:u.id,text:text(p.text,'o comentário',false,2000),visible});audit('Comentário '+(visible?'visível ao cliente':'interno'),o.id);
 }
 else if(kind==='user_perms'){
 boss();const target=found(s,'users',p.user);if(!CUSTOMIZABLE.includes(target.role))err('Permissões se aplicam a atendentes e técnicos');
 for(const k of Object.keys(p.perms||{}))if(!PERMS.some(x=>x[0]===k))err('Permissão desconhecida: '+k);
 const o=cleanOverrides(target.role,p.perms||{});if(Object.keys(o).length)target.perms=o;else delete target.perms;
 audit('Permissões de '+target.name+(Object.keys(o).length?' personalizadas':' restauradas ao padrão do perfil'));
 }
 else if(kind==='client_update'){
 staff();need('gerenciarClientes','Sem permissão para editar clientes');const c=found(s,'clients',p.client),email=text(p.email,'o e-mail',true).toLowerCase();
 if(email&&!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email))err('E-mail inválido');
 c.name=text(p.name,'o nome',false,200);c.phone=text(p.phone,'o telefone',false,60);c.email=email;c.document=text(p.document,'o documento',true,40);audit('Cliente atualizado: '+c.name);
 }
 else if(kind==='portal_user'){
 boss();found(s,'clients',p.client);const email=text(p.email,'o e-mail').toLowerCase();if(!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email))err('E-mail inválido');if(s.users.some(x=>x.email===email))err('E-mail já cadastrado');s.users.push({id:uid(),name:text(p.name,'o nome'),email,role:'Cliente',client:p.client,canApprove:p.canApprove==='Sim'});audit('Acesso empresarial cadastrado');
 }
 else if(kind==='quote'){
 if(customer)err('Sem permissão');need('editarOrcamento','Sem permissão para editar orçamentos');const o=order();if(!Array.isArray(p.items)||!p.items.length||p.items.length>200)err('Informe de 1 a 200 itens');
 const items=p.items.map(i=>{const a=found(s,'assets',i.component);forOrder(o,a);
 const base={id:uid(),component:a.id,qty:number(i.qty,'Quantidade',0.01,10000),decision:'Pendente',decisionHistory:[],comment:text(i.comment,'o comentário',true,2000),commentVisible:i.commentVisible===true};
 if(i.priceItem){const pi=found(s,'priceItems',i.priceItem);if(pi.active===false)err('Item desativado na tabela de preços: '+pi.name);return {...base,priceItem:pi.id,free:false,description:pi.name,price:pi.price,cost:pi.cost||0,warranty:pi.warranty??0}}
 return {...base,free:true,description:text(i.description,'a descrição'),price:number(i.price,'Preço',0,1e7),cost:!can(u,'verCustos')||i.cost===''||i.cost==null?0:number(i.cost,'Custo',0,1e7),warranty:number(i.warranty,'Garantia',0,3650)}});const discount=number(p.discount,'Desconto');if(!can(u,'decidirOrcamento')&&discount!==o.discount)err('O desconto é definido pelo atendimento');if(discount>items.reduce((v,i)=>v+i.qty*i.price,0))err('Desconto maior que o orçamento');if(items.reduce((v,i)=>v+i.qty*i.price,0)-discount<o.payments.reduce((v,i)=>v+i.amount,0))err('Total inferior aos pagamentos');o.items=items;o.discount=discount;o.approval=null;audit('Orçamento por componente versionado; decisões reiniciadas',o.id);
 }
 else if(kind==='decision'){
 const o=order();const group=o.items.filter(i=>i.component===p.component);if(!group.length)err('Componente sem orçamento');if(!customer&&!can(u,'decidirOrcamento'))err('Seu perfil não registra decisão comercial');const decision=pick(p.decision,['Aprovado','Recusado'],'Decisão');const channel=customer?'Portal do cliente':text(p.channel,'o canal');
 if(customer){if(!u.canApprove)err('Seu usuário tem acesso apenas para consulta');const contract=s.contracts.filter(c=>c.client===u.client&&c.start<=localDay(now)&&c.end>=localDay(now)).sort((a,b)=>b.created.localeCompare(a.created))[0];if(!contract||!contract.approvers.includes(u.email))err('Você não é aprovador em um contrato vigente');if(decision==='Aprovado'){const amount=o.items.filter(i=>i.decision==='Aprovado'||i.component===p.component).reduce((v,i)=>v+i.qty*i.price,0)-o.discount;if(amount>contract.approvalLimit)err('Valor acima do limite contratual; solicite aprovação à assistência')}}
 const projected=Math.max(0,o.items.filter(i=>i.component===p.component?decision!=='Recusado':i.decision!=='Recusado').reduce((v,i)=>v+i.qty*i.price,0)-o.discount);if(projected<o.payments.reduce((v,i)=>v+i.amount,0))err('Decisão reduziria o total abaixo dos pagamentos');for(const i of group){i.decision=decision;i.decisionHistory.push({at:now,user:u.name,channel,decision})}o.approval=o.items.every(i=>i.decision!=='Pendente')?{decision:o.items.some(i=>i.decision==='Aprovado')?'Aprovado':'Recusado',channel,at:now,user:u.name}:null;audit('Decisão de componente: '+decision,o.id,p.component);
 }
 else err('Operação ASIC desconhecida');
 return true;
}

const noCost=s=>({...s,orders:s.orders.map(o=>({...o,items:o.items.map(({cost,...i})=>i)})),priceItems:s.priceItems.map(({cost,...p})=>p),parts:s.parts.map(({cost,...p})=>p)});
export function visibleState(s,u){
 upgrade(s);if(u.role==='Administrador'||u.role==='Atendente')return can(u,'verCustos')?s:noCost(s);
 if(u.role==='Cliente'){
 const orders=s.orders.filter(o=>o.client===u.client).map(o=>({id:o.id,number:o.number,client:o.client,assetIds:o.assetIds||[],status:o.status,created:o.created,due:o.due,delivered:o.delivered,publicNote:o.publicNote,issue:o.issue,solution:o.solution,diagnosis:['Pronto para retirada','Entregue'].includes(o.status)?o.diagnosis:'',warranty:o.warranty,parent:o.parent,items:o.items.map(({cost,priceItem,free,comment,commentVisible,...i})=>commentVisible&&comment?{...i,comment}:i),comments:(o.comments||[]).filter(c=>c.visible).map(({id,at,text,fromClient})=>({id,at,text,fromClient:!!fromClient})),intake:o.intake?{complete:o.intake.complete,missing:o.intake.missing,note:o.intake.note}:null,discount:o.discount,approval:o.approval,payments:o.payments.map(({amount,method,at})=>({amount,method,at})),attachments:o.attachments.filter(a=>a.visibility==='Cliente'&&a.category!=='Backup'),history:[],reservations:[]}));
 const ids=new Set(orders.map(o=>o.id)),assets=s.assets.filter(a=>a.client===u.client).map(({notes,attachments,...a})=>a);
 return {settings:{name:s.settings.name},orders,assets,clients:s.clients.filter(c=>c.id===u.client).map(({panelCode,panelEnabled,...c})=>c),lots:s.lots.filter(l=>l.client===u.client).map(({notes,attachments,...l})=>l),shipments:s.shipments.filter(sh=>sh.client===u.client).map(({notes,...sh})=>sh),contracts:s.contracts.filter(c=>c.client===u.client),visits:s.visits.filter(v=>v.client===u.client).map(({report,...v})=>v),sessions:s.sessions.filter(t=>ids.has(t.order)&&t.status!=='Em execução').map(({configuration,conditions,samples,...t})=>t),returns:s.returns.filter(r=>ids.has(r.order)),users:[],priceItems:[],parts:[],movements:[],firmwares:[],articles:[],diagnostics:[],defects:[],donors:[],recoveries:[],viabilities:[],benches:[],bookings:[],routines:[],assetEvents:[],audit:[]};
 }
 const costs=can(u,'verCustos'),orders=s.orders.filter(o=>o.tech===u.id).map(o=>costs?o:({...o,items:o.items.map(({cost,...i})=>i)})),ids=new Set(orders.map(o=>o.id)),assetIds=new Set(orders.flatMap(o=>o.assetIds||[])),clientIds=new Set(orders.map(o=>o.client));
 return {...s,orders,priceItems:s.priceItems.filter(p=>p.active!==false).map(p=>{if(costs)return p;const {cost,...r}=p;return r}),parts:costs?s.parts:s.parts.map(({cost,...p})=>p),assets:s.assets.filter(a=>assetIds.has(a.id)),clients:s.clients.filter(c=>clientIds.has(c.id)).map(({panelCode,panelEnabled,...c})=>c),users:s.users.map(({id,name,role})=>({id,name,role})),lots:[],shipments:[],contracts:[],visits:s.visits.filter(v=>v.technician===u.id),viabilities:[],donors:s.donors.filter(d=>assetIds.has(d.asset)),recoveries:s.recoveries.filter(r=>s.donors.some(d=>d.id===r.donor&&assetIds.has(d.asset))),movements:s.movements.filter(m=>ids.has(m.order)),assetEvents:s.assetEvents.filter(e=>assetIds.has(e.asset)),audit:s.audit.filter(e=>ids.has(e.order)),bookings:s.bookings.map(b=>ids.has(b.order)?b:{id:b.id,bench:b.bench,start:b.start,end:b.end,cancelled:b.cancelled,order:'Indisponível'}),...Object.fromEntries(['diagnostics','defects','sessions','firmwares','returns'].map(k=>[k,s[k].filter(r=>ids.has(r.order))]))};
}

export function indicators(s,from='',to=''){
 upgrade(s);const os=s.orders.filter(o=>(!from||o.created.slice(0,10)>=from)&&(!to||o.created.slice(0,10)<=to));const ids=new Set(os.map(o=>o.id)),closed=os.filter(o=>o.status==='Entregue'),returns=s.returns.filter(r=>ids.has(r.order)),tests=s.sessions.filter(t=>ids.has(t.order)&&t.phase==='Depois'&&['Aprovado','Reprovado'].includes(t.status));const first=new Map();for(const t of tests.slice().sort((a,b)=>a.created.localeCompare(b.created)))if(!first.has(t.order+'|'+t.asset))first.set(t.order+'|'+t.asset,t);
 const average=closed.length?closed.reduce((v,o)=>v+(Date.parse(o.delivered||o.created)-Date.parse(o.created))/86400000,0)/closed.length:0;
 const wait={};for(const o of os){let status='Aberto',start=o.created;for(const h of [...o.history].sort((a,b)=>a.at.localeCompare(b.at))){if(h.message.startsWith('Atualização • ')){wait[status]=(wait[status]||0)+(Date.parse(h.at)-Date.parse(start))/3600000;status=h.message.slice('Atualização • '.length);start=h.at}}if(!terminal(o))wait[status]=(wait[status]||0)+(Date.now()-Date.parse(start))/3600000}
 const groups={};for(const o of os){for(const id of o.assetIds||[]){const a=s.assets.find(a=>a.id===id);if(a){const key=a.model+' / '+a.revision;groups[key]??={orders:0,returns:0};groups[key].orders++;groups[key].returns+=returns.filter(r=>r.asset===id).length}}}
 const cost=os.reduce((v,o)=>v+o.items.filter(i=>i.decision!=='Recusado').reduce((a,i)=>a+(i.cost||0)*i.qty,0),0),revenue=os.reduce((v,o)=>v+Math.max(0,o.items.filter(i=>i.decision!=='Recusado').reduce((a,i)=>a+i.qty*i.price,0)-o.discount),0);
 const componentFailures={},partsLots={};for(const d of s.defects.filter(d=>ids.has(d.order))){const a=s.assets.find(a=>a.id===d.asset),key=(a?.model||'')+' / '+(a?.revision||'')+' · '+d.component;componentFailures[key]=(componentFailures[key]||0)+1}
 for(const r of returns){const original=s.orders.find(o=>o.id===r.original);for(const reservation of original?.reservations.filter(r=>r.used)||[]){const p=s.parts.find(p=>p.id===reservation.part);if(p?.lot){const key=p.name+' · lote '+p.lot;partsLots[key]=(partsLots[key]||0)+1}}for(const recovery of s.recoveries){if(recovery.uses.some(use=>use.order===r.original&&use.destination===r.asset)){const key=recovery.code+' · lote '+recovery.lot;partsLots[key]=(partsLots[key]||0)+1}}}
 return {count:os.length,closed:closed.length,averageDays:round(average),returns:returns.length,returnRate:closed.length?round(100*returns.filter(r=>r.classification==='Mesmo defeito').length/closed.length):0,firstPass:first.size?round(100*[...first.values()].filter(t=>t.status==='Aprovado').length/first.size):0,cost:round(cost),quoted:round(revenue),quotedMargin:round(revenue-cost),wait,groups,componentFailures,partsLots,slaBreached:os.filter(o=>!terminal(o)&&o.slaDue&&o.slaDue<new Date().toISOString()).length,resources:s.benches.length,activeTests:s.sessions.filter(t=>t.status==='Em execução').length,booked:s.bookings.filter(b=>!b.cancelled&&b.start<=new Date().toISOString()&&b.end>=new Date().toISOString()).length};
}

// Código do painel do cliente: 12 símbolos de um alfabeto de 31 (sem I, L, O, 0, 1) = ~59 bits. byte<248 evita viés no módulo.
const CODE_ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function newPanelCode(){let out='';while(out.length<12)for(const b of crypto.getRandomValues(new Uint8Array(24)))if(b<248&&out.length<12)out+=CODE_ALPHABET[b%31];return out}
// Aceita minúsculas, traços e espaços; devolve o código normalizado ou null.
export const panelCodeFrom=v=>{const c=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{12}$/.test(c)?c:null};
// Painel público do cliente (acesso por código): só leitura e sem valores, custos, pagamentos nem observações internas.
export function publicPanel(s,clientId){
 upgrade(s);const c=found(s,'clients',clientId),code=id=>s.assets.find(a=>a.id===id)?.code;
 const orders=s.orders.filter(o=>o.client===clientId).map(o=>({number:o.number,open:!terminal(o),intake:o.intake?{complete:o.intake.complete,missing:o.intake.missing,note:o.intake.note}:null,comments:(o.comments||[]).filter(c=>c.visible).map(({at,text,fromClient})=>({at,text,fromClient:!!fromClient})).reverse(),code:oscode(o),status:o.status,created:o.created,due:o.due,delivered:o.delivered||null,issue:o.issue,note:o.publicNote,assets:(o.assetIds||[]).map(code).filter(Boolean),pendingDecisions:o.items.filter(i=>i.decision==='Pendente').length})).reverse();
 const assets=s.assets.filter(a=>a.client===clientId).map(a=>({code:a.code,kind:a.kind,model:a.model,revision:a.revision,serial:a.serial,status:a.status,location:a.location}));
 const lots=s.lots.filter(l=>l.client===clientId).map(l=>({code:l.code,name:l.name,received:l.received,expected:l.expected,counted:l.assets.length,closed:l.closed}));
 const shipments=s.shipments.filter(x=>x.client===clientId).map(x=>({lot:s.lots.find(l=>l.id===x.lot)?.code,status:x.status,carrier:x.carrier,tracking:x.tracking,units:x.assets.length}));
 const open=orders.filter(o=>!['Entregue','Cancelado'].includes(o.status));
 return {company:s.settings?.name||'',client:c.name,updated:new Date().toISOString(),summary:{open:open.length,ready:orders.filter(o=>o.status==='Pronto para retirada').length,awaiting:open.reduce((v,o)=>v+o.pendingDecisions,0),equipment:assets.length},orders,assets,lots,shipments};
}

// Mensagem/foto do cliente pelo painel: sempre vinculada a uma OS ABERTA do próprio cliente.
export function clientOrder(s,clientId,number){upgrade(s);const o=s.orders.find(x=>x.client===clientId&&x.number===Number(number));if(!o)err('Selecione uma OS sua');if(terminal(o))err('Esta OS já foi encerrada');return o}
const fromClient=(o,msg,extra={})=>{o.comments??=[];if(o.comments.length>=300)err('Limite de mensagens desta OS atingido');const c={id:crypto.randomUUID(),at:new Date().toISOString(),user:'Cliente (painel)',text:msg,visible:true,fromClient:true,...extra};o.comments.push(c);o.history.push({at:c.at,user:c.user,message:'Mensagem do cliente'});return c};
export function clientMessage(s,clientId,{order,text:t}){const o=clientOrder(s,clientId,order);return fromClient(o,text(t,'a mensagem',false,1000))}
export function clientPhoto(s,clientId,{order,key,name,type}){const o=clientOrder(s,clientId,order);if((o.attachments||[]).filter(a=>a.category==='Cliente').length>=30)err('Limite de fotos desta OS atingido');
 const at=new Date().toISOString(),n=String(name||'foto').slice(0,120);(o.attachments??=[]).push({id:key,name:n,type,category:'Cliente',visibility:'Cliente',at,user:'Cliente (painel)'});return fromClient(o,'Enviou uma foto: '+n,{attachment:key})}
