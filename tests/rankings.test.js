import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../js/storage.js';
import {review} from '../js/data.js';
import {rankings} from '../js/rankings.js';

test('solo suma horas validadas y se actualiza al validar, rechazar y reabrir',()=>{
 const db=seed();let result=rankings(db,'DEMO-001');assert.equal(result.current.hours,8);assert.equal(result.current.rank,1);assert.equal(result.current.pending,6);assert.equal(result.entries.find(s=>s.id==='DEMO-003').hours,0);
 review(db,'PAR-002','validado');assert.equal(rankings(db,'DEMO-001').current.hours,14);
 review(db,'PAR-001','rechazado');review(db,'PAR-002','pendiente');result=rankings(db,'DEMO-001');assert.equal(result.current.hours,0);assert.equal(result.current.rank,2);assert.equal(result.next.hours,4);
});
test('top de diez personas y puesto personal fuera del top, sin modificar los datos',()=>{
 const db=seed();db.estudiantes=Array.from({length:14},(_,i)=>({id:'S'+i,nombre:'Ficticio '+i,carrera:'Ingeniería'}));
 db.participaciones=db.estudiantes.map((s,i)=>({id:'P'+i,estudianteId:s.id,actividadId:'ACT-001',horasRealizadas:14-i,horasPropuestas:14-i,horasValidadasDemo:14-i,estadoValidacion:'validado'}));
 const before=JSON.stringify(db),result=rankings(db,'S13');assert.equal(result.top.length,10);assert.equal(result.current.rank,14);assert.equal(result.current.hours,1);assert.equal(result.total,14);assert.ok(!result.top.some(s=>s.id==='S13'));assert.equal(JSON.stringify(db),before);
});
test('empates comparten puesto con orden estable y se admiten estudiantes sin horas',()=>{
 const db=seed();db.participaciones[2].horasValidadasDemo=8;
 const result=rankings(db,'DEMO-002');assert.deepEqual(result.entries.map(s=>s.rank),[1,1,3,3,3]);assert.equal(result.current.rank,1);assert.equal(result.next,null);assert.equal(rankings({estudiantes:[],participaciones:[],actividades:[]},'missing').current,null);
});
