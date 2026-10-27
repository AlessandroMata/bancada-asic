// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import test from 'node:test';
import assert from 'node:assert/strict';
import {publicOrigin,sameOrigin,isSecure} from './http.mjs';
const rq=(url,h={})=>new Request(url,{method:'POST',headers:h});
test('direto em http: origem e cookie seguem o que o navegador enviou',()=>{
 const r=rq('http://127.0.0.1:8791/api/data',{origin:'http://127.0.0.1:8791'});assert.equal(publicOrigin(r),'http://127.0.0.1:8791');assert.equal(sameOrigin(r),true);assert.equal(isSecure(r),false);
});
test('atrás de túnel (TLS fora do app): usa X-Forwarded-Proto, cookie Secure e link https',()=>{
 const r=rq('http://app.example.com/api/auth/login',{origin:'https://app.example.com','x-forwarded-proto':'https'});
 assert.equal(publicOrigin(r),'https://app.example.com');assert.equal(sameOrigin(r),true);assert.equal(isSecure(r),true);
 assert.equal(publicOrigin(rq('http://h/x',{'x-forwarded-proto':'https, http'})),'https://h','lista de proxies: vale o primeiro');
});
test('o cabeçalho nunca rebaixa uma conexão que já chegou em https',()=>{
 const r=rq('https://app.example.com/a',{origin:'https://app.example.com','x-forwarded-proto':'http'});
 assert.equal(publicOrigin(r),'https://app.example.com');assert.equal(isSecure(r),true);assert.equal(sameOrigin(r),true);
});
test('origem de outro site, ausente ou com esquema/host diferente é recusada',()=>{
 for(const [url,h] of [['https://app.example.com/a',{origin:'https://evil.example'}],['https://app.example.com/a',{}],['http://app.example.com/a',{origin:'https://app.example.com'}],['https://app.example.com/a',{origin:'https://app.example.com.evil.com'}],['https://app.example.com/a',{origin:'null'}]])assert.equal(sameOrigin(rq(url,h)),false,url+JSON.stringify(h));
});
