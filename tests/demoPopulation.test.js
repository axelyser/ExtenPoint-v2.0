import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,check,save,load} from '../js/storage.js';
import {populateDemo} from '../js/demoPopulation.js';
import {rankings} from '../js/rankings.js';
test('amplía a 750 sin borrar datos, completa el top y conserva puesto personal fuera del top',()=>{
 const db=seed(),before=structuredClone(db);populateDemo(db);check(db);
 assert.equal(db.estudiantes.length,750);assert.deepEqual(db.estudiantes.slice(0,5),before.estudiantes);assert.deepEqual(db.participaciones.slice(0,4),before.participaciones);
 const result=rankings(db,'DEMO-001');assert.equal(result.top.length,10);assert.ok(result.current.rank>=1);assert.equal(result.current.hours,8);assert.equal(result.top[0].hours,10);
 assert.equal(new Set(db.participaciones.map(p=>p.estudianteId+'|'+p.actividadId)).size,db.participaciones.length);
 const raw=JSON.stringify(db);assert.equal(populateDemo(db),false);assert.equal(JSON.stringify(db),raw);
 let saved;save({setItem:(k,v)=>saved=v},db);assert.deepEqual(load({getItem:()=>saved}),db);
});

test('la demo genera y migra horas enteras sin alterar registros manuales',()=>{
 const db=seed();populateDemo(db);assert.ok(db.participaciones.filter(p=>p.sintetico).every(p=>Number.isInteger(p.horasValidadasDemo)&&Number.isInteger(p.horasRealizadas)));
 const synthetic=db.participaciones.find(p=>p.sintetico);synthetic.horasValidadasDemo=29.97;db.demoPopulationVersion=2;
 const original=structuredClone(db.participaciones[0]);populateDemo(db);assert.ok(Number.isInteger(synthetic.horasValidadasDemo));assert.deepEqual(db.participaciones[0],original);assert.equal(db.estudiantes.length,750);
});

test('migra la muestra anterior a horas semestrales de 1 a 10 sin duplicar estudiantes',()=>{
 const db=seed();populateDemo(db);db.demoPopulationVersion=3;
 const record=db.participaciones.find(p=>p.sintetico);record.horasValidadasDemo=30;
 const manual=structuredClone(db.participaciones.filter(p=>!p.sintetico));
 assert.equal(populateDemo(db),true);
 const board=rankings(db,'DEMO-001','2026-2');assert.equal(board.top.length,10);assert.equal(board.top[0].hours,10);
 assert.ok(board.entries.filter(s=>s.sintetico).every(s=>Number.isInteger(s.hours)&&s.hours>=1&&s.hours<=10));
 assert.equal(db.estudiantes.length,750);assert.deepEqual(db.participaciones.filter(p=>!p.sintetico),manual);
 assert.equal(populateDemo(db),false);
});


