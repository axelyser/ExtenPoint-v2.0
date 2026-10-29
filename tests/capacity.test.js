import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCapacity,capacityStatus} from '../js/capacity.js';
import {addActivity} from '../js/data.js';
test('el cupo acepta solo enteros positivos acotados',()=>{
 for(const value of ['',0,-1,1.5,'abc',Infinity,null,10001])assert.throws(()=>parseCapacity(value));
 assert.equal(parseCapacity('25'),25);
 assert.equal(parseCapacity(),30);
});
test('la disponibilidad utiliza el conteo global y detecta el último lugar',()=>{
 const activity={id:'taller',cupoMaximo:2};
 assert.deepEqual(capacityStatus(activity,{taller:1}),{total:2,enrolled:1,available:1,full:false});
 assert.equal(capacityStatus(activity,{taller:2}).full,true);
 assert.equal(capacityStatus(activity,{taller:3}).available,0);
 assert.equal(capacityStatus(activity,{}).available,2);
});
test('nuevas actividades conservan el cupo elegido y rechazan cupos fraccionarios',()=>{
 const form={nombre:'Prueba',descripcion:'Demo',fecha:'2026-11-10',organizador:'Demo',lineaAccion:0,tipoActividad:'Taller',modalidad:'presencial',duracionHoras:2,estado:'planificada',regla:'Provisional',rolRegla:'participante',limite:'',evidenciaRequerida:'Informe',cupoMaximo:'45'};
 const db={actividades:[]};
 assert.equal(addActivity(db,form).cupoMaximo,45);
 assert.throws(()=>addActivity(db,{...form,cupoMaximo:'2.5'}));
 assert.equal(db.actividades.length,1);
});
