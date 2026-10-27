// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
'use client';
import React,{useState,useEffect} from 'react';
import {Camera,X} from 'lucide-react';
export const MAX_PHOTOS=12;
// Foto de celular passa fácil de 10 MB (limite do servidor): reduz para 2200 px em JPEG antes de enviar.
export async function shrink(file:File):Promise<File>{
 if(!file.type.startsWith('image/')||file.type==='image/gif')return file;
 try{
  const bmp=await createImageBitmap(file),k=Math.min(1,2200/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
  c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d')!.drawImage(bmp,0,0,c.width,c.height);
  const blob:Blob|null=await new Promise(r=>c.toBlob(r,'image/jpeg',0.85));
  return blob&&blob.size<file.size?new File([blob],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):file;
 }catch{return file}
}
// Envia em sequência (cada envio grava a OS; em paralelo daria conflito de versão). Devolve os nomes que falharam.
export async function uploadPhotos(order:string,files:File[],progress?:(n:number)=>void,category='Recebimento'){
 const failed:string[]=[];
 for(let i=0;i<files.length;i++){
  progress?.(i+1);
  try{
   const f=new FormData();f.set('file',await shrink(files[i]));f.set('scope','order');f.set('record',order);f.set('category',category);
   const r=await fetch('/api/files',{method:'POST',body:f});if(!r.ok)throw Error();
  }catch{failed.push(files[i].name)}
 }
 return failed;
}
export function PhotoPicker({files,setFiles,disabled,label='Fotos da entrada (opcional)'}:{files:File[];setFiles:(f:File[])=>void;disabled?:boolean;label?:string}){
 const [urls,setUrls]=useState<string[]>([]),[note,setNote]=useState('');
 useEffect(()=>{const u=files.map(f=>URL.createObjectURL(f));setUrls(u);return()=>u.forEach(x=>URL.revokeObjectURL(x))},[files]);
 function add(list:FileList|null){
  const picked=Array.from(list||[]).filter(f=>f.type.startsWith('image/')),room=MAX_PHOTOS-files.length;
  setNote(picked.length<(list?.length||0)?'Só imagens são aceitas aqui; os outros arquivos foram ignorados.':picked.length>room?'Limite de '+MAX_PHOTOS+' fotos por entrada; as demais foram ignoradas.':'');
  setFiles([...files,...picked.slice(0,Math.max(0,room))]);
 }
 return <div className="full photopicker">
  <span className="photolabel">{label}</span>
  <label className="upload"><Camera size={24}/><strong>Tirar ou escolher fotos</strong><span>JPG, PNG ou WebP · até {MAX_PHOTOS} fotos · reduzidas automaticamente</span>
   <input type="file" accept="image/*" multiple disabled={disabled||files.length>=MAX_PHOTOS} onChange={e=>{add(e.target.files);e.target.value=''}}/></label>
  {note&&<p className="muted" role="status">{note}</p>}
  {files.length>0&&<ul className="photogrid" aria-label="Fotos selecionadas">{files.map((f,i)=><li key={f.name+i+f.size}><img src={urls[i]} alt={'Foto '+(i+1)+' da entrada'}/><button type="button" aria-label={'Remover foto '+(i+1)} disabled={disabled} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}><X size={14}/></button></li>)}</ul>}
 </div>;
}
