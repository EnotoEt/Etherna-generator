/* Pure generation engine; independent from UI, suitable for later NPC modules. */
(function(root){'use strict';
function pick(items,rng=Math.random){if(!items.length)throw Error('Пустая таблица');return items[Math.min(items.length-1,Math.floor(rng()*items.length))];}
function weighted(items,weight,rng=Math.random){const eligible=items.filter(x=>weight(x)>0);const total=eligible.reduce((a,x)=>a+weight(x),0);if(!total)throw Error('Нет записей с положительным весом');let n=rng()*total;for(const x of eligible){n-=weight(x);if(n<0)return x;}return eligible[eligible.length-1];}
function create(data,rng=Math.random){const sexes=['♀','♂'];const occupation=context=>weighted(data.jobs,j=>j[context],rng).name;const name=(r,s)=>pick(data.names[r][s],rng);const surname=r=>pick(data.surnames[r],rng);
function identity(f){const r=f.race==='any'?pick(data.races,rng):f.race;const s=f.sex==='any'?pick(sexes,rng):f.sex;return{race:r,sex:s,name:name(r,s),surname:surname(r),job:occupation(f.context),context:f.context};}
return{identity,name,surname,occupation};}
root.EternaEngine={create,pick,weighted};if(typeof module!=='undefined')module.exports=root.EternaEngine;
})(globalThis);
