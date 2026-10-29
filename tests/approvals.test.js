import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,load,save} from '../js/storage.js';
import {addActivity,addAttendance,review} from '../js/data.js';
import {approvalOf,decideActivity,resubmitActivity} from '../js/approvals.js';
const form={nombre:'Proyecto nuevo',descripcion:'Ficticio',fecha:'2026-10-29',organizador:'Equipo',lineaAccion:'0',tipoActividad:'Proyecto',modalidad:'presencial',duracionHoras:'4',estado:'planificada',regla:'Provisional',rolRegla:'participante',limite:'',evidenciaRequerida:'Informe'};
test('la aprobación directiva es necesaria para registrar y no valida horas automáticamente',()=>{
 const db=seed(),a=addActivity(db,form),f={actividadId:a.id,estudianteId:'DEMO-001',rol:'participante',horasRealizadas:'4',horasPropuestas:'4',referenciaEvidencia:'Informe ficticio'};
 assert.equal(approvalOf(a),'pendiente');assert.throws(()=>addAttendance(db,f),/aprobación/);
 assert.throws(()=>decideActivity(db,a.id,'aprobada','Revisado','organizador'),/Solo/);
 assert.throws(()=>decideActivity(db,a.id,'aprobada','','directivo'),/observación/);
 decideActivity(db,a.id,'aprobada','Revisado en demo','directivo');
 const p=addAttendance(db,f);assert.equal(p.estadoValidacion,'pendiente');assert.equal(p.horasValidadasDemo,0);
 assert.equal(db.auditoria.at(-1).actividadId,a.id);assert.ok(a.aprobacion.fecha);
 assert.throws(()=>decideActivity(db,a.id,'rechazada','Cambio','directivo'),/pendiente/);
 review(db,p.id,'validado');assert.equal(p.horasValidadasDemo,4);
});
test('rechazar, aclarar y reenviar preserva decisiones y permite una nueva revisión',()=>{
 const db=seed(),a=addActivity(db,form);
 decideActivity(db,a.id,'rechazada','Falta autorización','directivo');
 assert.throws(()=>resubmitActivity(db,a.id,'','organizador'),/aclaración/);
 assert.throws(()=>resubmitActivity(db,a.id,'Aclaración','estudiante'),/Solo/);
 resubmitActivity(db,a.id,'Se adjuntó referencia de autorización ficticia','organizador');
 assert.equal(approvalOf(a),'pendiente');decideActivity(db,a.id,'aprobada','Referencia revisada','directivo');
 assert.equal(db.auditoria.filter(r=>r.actividadId===a.id).length,3);
 let raw;const storage={setItem:(k,v)=>raw=v,getItem:()=>raw};save(storage,db);assert.deepEqual(load(storage),db);
});
test('los datos antiguos requieren aprobación sin borrar participaciones ni sus horas históricas',()=>{
 const db=seed();for(const a of db.actividades)delete a.aprobacion;
 const restored=load({getItem:()=>JSON.stringify(db)});assert.equal(approvalOf(restored.actividades[0]),'pendiente');
 assert.deepEqual(restored.participaciones,db.participaciones);
 assert.throws(()=>review(restored,'PAR-001','validado'),/aprobada/);
});
