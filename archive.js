/* Local NPC archive, version 0.5. No network or external dependencies. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const key='eterna-npc-archive-v1';
const metaFields=['campaign','location','importance','status','relation','tags','notes','locationId','cityId','objectId'];
const options={importance:['Ключевой','Второстепенный','Случайный'],status:['Жив','Мёртв','Пропал','Неизвестно'],relation:['Дружественное','Нейтральное','Враждебное']};
const uid=()=>globalThis.crypto?.randomUUID?.()||'npc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'?x:'';
function meta(m){return {...Object.fromEntries(metaFields.map(k=>[k,text(m?.[k])])),favorite:m?.favorite===true};}
function create({races,looks,personality,moods,storage}){
 let records=[],error='',raw=null;
 const backend=()=>storage||globalThis.localStorage;
 function normalize(n){if(!plain(n)||typeof n.name!=='string'||!n.name.trim()||typeof n.surname!=='string'||typeof n.job!=='string'||!races.includes(n.race)||!['♀','♂'].includes(n.sex)||!['city','village','road'].includes(n.context))throw Error('Некорректная идентификация NPC');
  if(n.appearance!=null&&!looks.valid(n.appearance,n.race))throw Error('Некорректная внешность');
  if(n.personality!=null&&!personality.valid(n.personality))throw Error('Некорректная личность');
  if(n.mood!=null&&!moods.valid(n.mood))throw Error('Некорректное настроение');
  if(n.meta!=null&&(!plain(n.meta)||metaFields.some(k=>n.meta[k]!=null&&typeof n.meta[k]!=='string')||(n.meta.favorite!=null&&typeof n.meta.favorite!=='boolean')))throw Error('Некорректные дополнительные поля');
  if(n.meta?.locationId&&n.meta?.cityId||n.meta?.objectId&&!n.meta?.cityId)throw Error('Противоречивые ссылки NPC');
  const result={name:n.name,surname:n.surname,job:n.job,race:n.race,sex:n.sex,context:n.context,meta:meta(n.meta)};
  if(n.appearance!=null)result.appearance={race:n.race,type:n.appearance.type,fields:Object.fromEntries(root.EternaEngine.appearanceFields.map(k=>[k,n.appearance.fields[k]]))};
  if(n.personality!=null)result.personality=Object.fromEntries(root.EternaEngine.personalityFields.map(k=>[k,n.personality[k]]));
  if(n.mood!=null)result.mood=Object.fromEntries(['id','name','manifestation','complication'].map(k=>[k,n.mood[k]]));
  return {...result,id:text(n.id)||uid(),createdAt:text(n.createdAt),updatedAt:text(n.updatedAt)};
 }
 const signature=n=>JSON.stringify(Object.fromEntries(Object.entries(n).filter(([k])=>!['id','createdAt','updatedAt'].includes(k))));
 try{raw=backend().getItem(key);if(raw!==null){const old=JSON.parse(raw);if(!Array.isArray(old))throw Error('Неверный формат архива');records=old.map(normalize);const ids=new Set();for(const n of records){if(ids.has(n.id))n.id=uid();ids.add(n.id)}if(old.some((n,i)=>n.id!==records[i].id||!n.meta)){try{backend().setItem(key,JSON.stringify(records));}catch(e){/* old archive remains intact, writes will report failure */}}}}catch(e){error='Не удалось прочитать локальный архив. Исходные данные не перезаписаны. '+e.message;records=[];}
 function commit(next){if(error)throw Error('Архив защищён от перезаписи: сначала сохраните исходные данные.');backend().setItem(key,JSON.stringify(next));records=next;}
 function save(n,id){const previous=id?records.find(x=>x.id===id):null;if(id&&!previous)throw Error('Запись больше не существует. Сохраните как нового NPC.');const now=new Date().toISOString();const value=normalize({...n,id:previous?.id||uid(),createdAt:previous?.createdAt||now,updatedAt:now});commit(previous?records.map(x=>x.id===id?value:x):[value,...records]);return clone(value);}
 function remove(id){commit(records.filter(x=>x.id!==id));}
 function favorite(id){const n=records.find(x=>x.id===id);if(!n)return;return save({...n,meta:{...n.meta,favorite:!n.meta.favorite}},id);}
 function preview(input){const items=Array.isArray(input)?input:input?.characters;if(!Array.isArray(items))throw Error('Ожидается массив NPC или объект с characters.');if(items.length>20000)throw Error('Слишком много записей (максимум 20 000 за импорт).');const next=records.slice(),ids=new Map(next.map(n=>[n.id,n])),signatures=new Set(next.map(signature));let added=0,skipped=0,conflicts=0;for(let i=0;i<items.length;i++){let n;try{n=normalize(items[i]);}catch(e){throw Error('Запись '+(i+1)+': '+e.message)}const existing=ids.get(n.id);if(existing){if(signature(existing)===signature(n))skipped++;else conflicts++;continue}if(!items[i].id&&signatures.has(signature(n))){skipped++;continue}next.push(n);ids.set(n.id,n);signatures.add(signature(n));added++;}return {next,added,skipped,conflicts};}
 return {key,meta,options,all:()=>clone(records),get:id=>{const n=records.find(x=>x.id===id);return n?clone(n):null},save,remove,favorite,preview,importPreview:p=>commit(p.next),error:()=>error,raw:()=>raw};
}
root.EternaArchive={create,meta,options,key};if(typeof module!=='undefined')module.exports=root.EternaArchive;
})(globalThis);
