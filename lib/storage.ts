// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import {empty} from './domain.mjs';
import {upgrade} from './asic.mjs';
type Snapshot=Record<string,string>;
export async function readState(db:any):Promise<{s:any,version:number,snapshot:Snapshot}>{
 for(let attempt=0;attempt<3;attempt++){
 const row=await db.prepare('SELECT * FROM store WHERE id=1').first();const payload=JSON.parse(row.data);
 if(payload.format!=='records-v2')return {s:upgrade(payload),version:row.version,snapshot:{}};
 const rows=await db.prepare('SELECT collection,id,data FROM records').all();const check=await db.prepare('SELECT version FROM store WHERE id=1').first();if(check.version!==row.version)continue;
 const s:any=upgrade(empty()),snapshot:Snapshot={};for(const r of rows.results){if(!Array.isArray(s[r.collection]))throw Error('Coleção desconhecida no banco');s[r.collection].push(JSON.parse(r.data));snapshot[r.collection+'/'+r.id]=r.data}
 for(const [key,list] of Object.entries(s)){if(Array.isArray(list))list.sort((a:any,b:any)=>key==='orders'?a.number-b.number:String(a.created||a.at||a.code||a.name||'').localeCompare(String(b.created||b.at||b.code||b.name||'')))}s.settings=payload.settings;s.versionASIC=payload.versionASIC;return {s,version:row.version,snapshot};
 }throw Error('Os dados mudaram em outra sessão. Atualize e tente novamente.');
}
export async function writeState(db:any,s:any,version:number,snapshot:Snapshot={}){
 const nonce=crypto.randomUUID(),metadata=JSON.stringify({format:'records-v2',nonce,settings:s.settings,versionASIC:s.versionASIC});
 const statements=[db.prepare('UPDATE store SET data=?,version=version+1 WHERE id=1 AND version=?').bind(metadata,version)];const seen=new Set<string>();
 for(const [collection,records] of Object.entries(s)){
 if(!Array.isArray(records))continue;
 for(const record of records){if(typeof record.id!=='string')throw Error('Registro sem identificador');const key=collection+'/'+record.id,data=JSON.stringify(record);if(new TextEncoder().encode(data).length>1000000)throw Error('Registro muito grande. Separe logs em anexos.');seen.add(key);if(snapshot[key]===data)continue;
 statements.push(db.prepare('INSERT INTO records (collection,id,data) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM store WHERE id=1 AND json_extract(data,\'$.nonce\')=?) ON CONFLICT(collection,id) DO UPDATE SET data=excluded.data').bind(collection,record.id,data,nonce));
 }}
 for(const key of Object.keys(snapshot)){if(seen.has(key))continue;const slash=key.indexOf('/');statements.push(db.prepare('DELETE FROM records WHERE collection=? AND id=? AND EXISTS (SELECT 1 FROM store WHERE id=1 AND json_extract(data,\'$.nonce\')=?)').bind(key.slice(0,slash),key.slice(slash+1),nonce))}
 if(statements.length>900)throw Error('Esta operação altera muitos registros. Divida o lote em entradas menores.');
 const result=await db.batch(statements);if(!result[0].meta.changes)throw Error('Os dados mudaram em outra sessão. Atualize e tente novamente.');
}
