/* Pure generation engine; independent from UI, suitable for later NPC modules. */
(function(root){'use strict';
function pick(items,rng=Math.random){if(!items.length)throw Error('Пустая таблица');return items[Math.min(items.length-1,Math.floor(rng()*items.length))];}
function weighted(items,weight,rng=Math.random){const eligible=items.filter(x=>weight(x)>0);const total=eligible.reduce((a,x)=>a+weight(x),0);if(!total)throw Error('Нет записей с положительным весом');let n=rng()*total;for(const x of eligible){n-=weight(x);if(n<0)return x;}return eligible[eligible.length-1];}
function create(data,rng=Math.random){const sexes=['♀','♂'];const occupation=context=>weighted(data.jobs,j=>j[context],rng).name;const name=(r,s)=>pick(data.names[r][s],rng);const surname=r=>pick(data.surnames[r],rng);
function identity(f){const r=f.race==='any'?pick(data.races,rng):f.race;const s=f.sex==='any'?pick(sexes,rng):f.sex;return{race:r,sex:s,name:name(r,s),surname:surname(r),job:occupation(f.context),context:f.context};}
return{identity,name,surname,occupation};}
const appearanceFields=['Возраст','Рост и сложение','Покров','Характерная черта','Отличительная примета'];
function createAppearance(profiles,rng=Math.random){
 function eligible(race,field,type){const rows=profiles[race]?.[field]||[];return rows.filter(x=>!x.condition||x.condition==='Тип эльфа='+type);}
 function roll(race,field,type){return weighted(eligible(race,field,type),x=>x.weight,rng).value;}
 function generate(race){const type=race==='Эльф'?roll(race,'Тип эльфа',''):null;return {race,type,fields:Object.fromEntries(appearanceFields.map(f=>[f,roll(race,f,type)]))};}
 function reroll(a,field){if(!appearanceFields.includes(field))throw Error('Неизвестное поле');return {...a,fields:{...a.fields,[field]:roll(a.race,field,a.type)}};}
 function valid(a,race){return !!a&&a.race===race&&(race==='Эльф'?['Светлый','Тёмный'].includes(a.type):a.type===null)&&appearanceFields.every(f=>typeof a.fields?.[f]==='string'&&a.fields[f].length>0);}
 return {generate,reroll,valid,eligible};
}
root.EternaEngine={create,pick,weighted,createAppearance,appearanceFields};if(typeof module!=='undefined')module.exports=root.EternaEngine;
})(globalThis);
