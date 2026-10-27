// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import test from 'node:test';
import assert from 'node:assert/strict';
import {empty,mutate,total,paid} from './domain.mjs';
const admin={id:'admin',name:'Admin',role:'Administrador'},att={id:'att',name:'Atendente',role:'Atendente'},tech={id:'tech',name:'Técnico',role:'Técnico'};
function setup(){const s=empty();s.users=[admin,att,tech];mutate(s,att,'client',{name:'Cliente teste',phone:'11999999999'});mutate(s,admin,'part',{name:'Tela',code:'T1',stock:2,cost:50,price:100,minimum:1});mutate(s,att,'order',{client:s.clients[0].id,type:'Celular',model:'Modelo',issue:'Tela quebrada',priority:'Normal',tech:'tech'});return {s,id:s.orders[0].id}}
const run=(s,u,a,p)=>mutate(s,u,a,p);
test('abertura gera número, vínculo, token e histórico',()=>{const {s}=setup();assert.equal(s.orders[0].number,1);assert.equal(s.orders[0].client,s.clients[0].id);assert.equal(s.orders[0].token.length,72);assert.equal(s.orders[0].history.length,1)});
test('fluxo orçamento, aprovação, reserva, utilização, pagamento parcial e entrega',()=>{const {s,id}=setup();run(s,tech,'quote',{id,items:[{description:'Tela',qty:1,price:150}],discount:10});assert.equal(total(s.orders[0]),140);assert.throws(()=>run(s,att,'update',{id,status:'Pronto para retirada'}),/aprovação/);run(s,att,'approve',{id,decision:'Aprovado',channel:'Presencial'});run(s,tech,'reserve',{id,part:s.parts[0].id,qty:1});run(s,tech,'consume',{id,reservation:s.orders[0].reservations[0].id});assert.equal(s.parts[0].stock,1);run(s,att,'payment',{id,amount:50,method:'Pix'});assert.throws(()=>run(s,att,'update',{id,status:'Entregue'}),/saldo/);run(s,att,'payment',{id,amount:90,method:'Dinheiro'});assert.equal(paid(s.orders[0]),140);run(s,att,'update',{id,status:'Entregue'});assert.equal(s.orders[0].status,'Entregue');assert.ok(s.orders[0].delivered)});
test('alteração de orçamento invalida aprovação',()=>{const {s,id}=setup();run(s,att,'approve',{id,decision:'Aprovado',channel:'Telefone'});run(s,tech,'quote',{id,items:[{description:'Reparo',qty:1,price:99}],discount:0});assert.equal(s.orders[0].approval,null)});
test('reservas evitam estoque negativo e cancelamento libera peças',()=>{const {s,id}=setup();run(s,tech,'reserve',{id,part:s.parts[0].id,qty:2});assert.throws(()=>run(s,tech,'reserve',{id,part:s.parts[0].id,qty:1}),/insuficiente/);run(s,att,'update',{id,status:'Cancelado'});assert.equal(s.orders[0].reservations.length,0);assert.equal(s.parts[0].stock,2)});
test('permissões e exceção administrativa',()=>{const {s,id}=setup();assert.throws(()=>run(s,{...tech,id:'other'},'update',{id,status:'Em análise'}),/atribuído/);assert.throws(()=>run(s,tech,'payment',{id,amount:1,method:'Pix'}),/perfil/);run(s,tech,'quote',{id,items:[{description:'Reparo',qty:1,price:99}],discount:0});assert.throws(()=>run(s,admin,'update',{id,status:'Pronto para retirada'}),/aprovação/);run(s,admin,'update',{id,status:'Pronto para retirada',exception:'Autorização presencial do gerente'});assert.ok(s.orders[0].history.some(x=>x.message.includes('Exceção')))});
test('pagamentos maiores que o saldo são rejeitados',()=>{const {s,id}=setup();assert.throws(()=>run(s,att,'payment',{id,amount:10,method:'Pix'}),/saldo/)});
test('configurações guardam as cláusulas do termo, só o administrador altera e há limite de tamanho',()=>{
 const {s}=setup();run(s,admin,'settings',{name:'Loja X',warranty:60,terms:'  1. Cláusula própria.  '});
 assert.deepEqual(s.settings,{name:'Loja X',warranty:60,terms:'1. Cláusula própria.'});
 run(s,admin,'settings',{name:'Loja X',warranty:60});assert.equal(s.settings.terms,'');
 assert.throws(()=>run(s,admin,'settings',{name:'Loja X',warranty:60,terms:'x'.repeat(4001)}),/cláusulas/i);
 assert.throws(()=>run(s,att,'settings',{name:'Y',warranty:1,terms:'z'}),/administrador/i);
});
