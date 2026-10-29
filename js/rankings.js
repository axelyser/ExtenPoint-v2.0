import {summary} from './extensionRules.js';

// El ranking usa horas validadas en demo, sin una conversión a créditos oficiales.
// Empates: mismo puesto; el siguiente salta las posiciones ocupadas (1, 2, 2, 4).
export function periodForDate(date){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date||'');
  if(!match||Number(match[2])<1||Number(match[2])>12)return null;
  return match[1]+'-'+(Number(match[2])<=6?'1':'2');
}
export function currentPeriod(){return periodForDate(new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Asuncion',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));}
export function periodLabel(period){return period.slice(0,4)+' · '+(period.endsWith('-1')?'Primer semestre':'Segundo semestre');}
export function availablePeriods(db){const years=new Set([currentPeriod().slice(0,4),...db.actividades.map(a=>periodForDate(a.fecha)?.slice(0,4)).filter(Boolean)]);return [...years].flatMap(y=>[y+'-2',y+'-1']).sort().reverse();}
export function rankings(db,studentId,period=null){
  const activityIds=new Set(db.actividades.filter(a=>!period||periodForDate(a.fecha)===period).map(a=>a.id));
  const scoped=period?{...db,participaciones:db.participaciones.filter(p=>activityIds.has(p.actividadId))}:db;
  const ordered=db.estudiantes.map(student=>{
    const totals=summary(scoped,student.id);
    return {...student,hours:totals.validated,pending:totals.pending,lines:totals.count,
      activities:scoped.participaciones.filter(p=>p.estudianteId===student.id&&p.estadoValidacion==='validado'&&p.horasValidadasDemo>0).length};
  }).sort((a,b)=>b.hours-a.hours||a.nombre.localeCompare(b.nombre,'es')||a.id.localeCompare(b.id));
  let rank=0;
  const entries=ordered.map((student,i)=>{
    if(i===0||student.hours!==ordered[i-1].hours)rank=i+1;
    return {...student,rank};
  });
  const current=entries.find(student=>student.id===studentId)||null;
  return {entries,top:entries.slice(0,10),current,total:entries.length,
    next:current?entries.filter(student=>student.hours>current.hours).at(-1)||null:null};
}
