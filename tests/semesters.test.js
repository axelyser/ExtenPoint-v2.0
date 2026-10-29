import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../js/storage.js';
import {rankings,periodForDate,availablePeriods} from '../js/rankings.js';
import {summary} from '../js/extensionRules.js';
test('límites de semestre y separación de años',()=>{
 assert.equal(periodForDate('2026-06-30'),'2026-1');assert.equal(periodForDate('2026-07-01'),'2026-2');assert.equal(periodForDate('2027-01-01'),'2027-1');assert.equal(periodForDate(''),null);
});
test('el ranking usa fecha de actividad, mantiene pendientes separados e historial intacto',()=>{
 const db=seed();db.actividades[0].fecha='2026-06-30';db.actividades[1].fecha='2026-07-01';db.actividades[2].fecha='2027-01-01';
 db.participaciones[0].fechaValidacion='2026-08-01T12:00:00Z';
 assert.equal(rankings(db,'DEMO-001','2026-1').current.hours,8);
 assert.equal(rankings(db,'DEMO-001','2026-2').current.hours,0);
 assert.equal(rankings(db,'DEMO-001','2026-2').current.pending,6);
 assert.equal(rankings(db,'DEMO-002','2027-1').current.hours,4);
 assert.equal(rankings(db,'DEMO-001','2027-2').current.hours,0);
 assert.equal(summary(db,'DEMO-001').validated,8);
 assert.ok(availablePeriods(db).includes('2027-1'));
});

