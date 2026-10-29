import test from 'node:test';
import assert from 'node:assert/strict';
import {activityLink,qrSvg,qrImage,activityRoute} from '../js/qr.js';

test('enlace de QR único y estable por actividad en el dominio público',()=>{
 const link=activityLink('https://extenpoint-v20.vercel.app/?extra=1#organizador','ACT-demo á');
 assert.equal(new URL(link).origin,'https://extenpoint-v20.vercel.app');assert.equal(new URL(link).search,'');
 assert.equal(activityRoute(new URL(link).hash),'ACT-demo á');
 assert.notEqual(link,activityLink('https://extenpoint-v20.vercel.app/','otra'));
 assert.throws(()=>activityLink('javascript:alert(1)','id'));
 assert.throws(()=>activityLink('http://example.com','id'));
});
test('genera SVG descargable e imagen local sin servicios de QR externos',()=>{
 const link=activityLink('https://extenpoint-v20.vercel.app/','ACT-001');const svg=qrSvg(link);
 assert.ok(svg.startsWith('<svg'));assert.ok(svg.includes('viewBox'));assert.ok(svg.includes('<path'));assert.ok(!svg.includes('<script'));
 assert.equal(decodeURIComponent(qrImage(link).split(',')[1]),svg);
 assert.equal(activityRoute('#inicio'),null);assert.equal(activityRoute('#actividad/%zz'),null);
});
