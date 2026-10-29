// Datos sintéticos reproducibles para la presentación; nunca son registros oficiales.
export function populateDemo(db){
  if(db.demoPopulationVersion===5)return false;
  for(const p of db.participaciones){const a=db.actividades.find(a=>a.id===p.actividadId);if(p.referenciaEvidencia==='Informe final ficticio QA'&&a?.nombre==='Jornada ficticia QA'&&p.horasPropuestas===4){p.horasRealizadas=1;p.horasPropuestas=1;p.horasValidadasDemo=p.estadoValidacion==='validado'?1:0;}}
  const count=Math.max(0,750-db.estudiantes.length);
  const first=['Ana','Bruno','Camila','Daniel','Elena','Federico','Gabriela','Hugo','Isabel','Joaquín','Karina','Lucas','Mariana','Nicolás','Olivia','Pablo','Renata','Santiago','Tamara','Ulises','Victoria','Walter','Ximena','Yago','Zoe','Adrián','Belén','César','Diana','Esteban'];
  const last=['Aguilar','Barrios','Caballero','Delgado','Escobar','Fernández','Giménez','Herrera','Ibarra','Jiménez','Lezcano','Medina','Núñez','Ortiz','Paredes','Quintana','Ramírez','Salinas','Torres','Urbieta','Vázquez','Villalba','Zárate','Peralta','Franco'];
  const careers=['Ingeniería Civil','Ingeniería Industrial','Ingeniería Electromecánica','Ingeniería Electrónica','Ingeniería Geográfica y Ambiental','Ingeniería Mecánica','Ingeniería Informática'];
  const date='2026-10-23T12:00:00Z';
  if([1,2,3,4].includes(db.demoPopulationVersion)){
    for(const student of db.estudiantes.filter(s=>s.sintetico)){
      const i=Number(student.id.match(/DEMO-RANK-(\d+)/)?.[1])-1;
      if(!Number.isInteger(i)||i<0)continue;
      student.nombre=first[i%first.length]+' '+last[(i*7+Math.floor(i/first.length))%last.length];
      const amounts=demoHours(i);
      for(const p of db.participaciones.filter(p=>p.estudianteId===student.id&&p.sintetico)){
        const j=Number(p.id.match(/-(\d+)$/)?.[1]);if(!Number.isInteger(j)||j>2)continue;
        p.horasRealizadas=amounts[j];p.horasPropuestas=amounts[j];p.horasValidadasDemo=p.estadoValidacion==='validado'?amounts[j]:0;
      }
    }
    db.demoPopulationVersion=5;return true;
  }
  const activityIds=[0,1,3].map((line,i)=>{
    let id='DEMO-RANK-ACT-'+i;while(db.actividades.some(a=>a.id===id))id+='-demo';
    db.actividades.push({id,nombre:['Proyecto comunitario · muestra sintética','Apoyo técnico · muestra sintética','Programa educativo · muestra sintética'][i],descripcion:'Actividad y participaciones completamente ficticias generadas para la presentación del ranking.',fecha:'2026-10-22',organizador:'Equipo de demostración',lineaAccion:line,tipoActividad:'Proyecto ficticio',modalidad:'presencial',duracionHoras:i===0?12:10,estado:'finalizada',aprobacion:{estado:'aprobada',comentario:'Aprobación simulada para datos sintéticos',fecha:date,actor:'Directivo de demostración'},referenciaAutorizacion:'Ficticia: sin autorización institucional real',reglaAcreditacion:{regla:'Horas manuales provisionales para muestra sintética, sin equivalencia oficial',rol:'participante',factor:null,limite:i===0?12:10,observaciones:'Dataset de presentación pendiente de cualquier revisión institucional real',evidenciaRequerida:'Informe ficticio de demostración'}});
    return id;
  });
  for(let i=0;i<count;i++){
    let id='DEMO-RANK-'+String(i+1).padStart(4,'0');while(db.estudiantes.some(s=>s.id===id))id+='-demo';
    db.estudiantes.push({id,nombre:first[i%first.length]+' '+last[(i*7+Math.floor(i/first.length))%last.length],carrera:careers[i%careers.length],semestre:1+i%10,sintetico:true});
    const amounts=demoHours(i);
    amounts.forEach((value,j)=>{const hours=value;db.participaciones.push({id:'PAR-'+id+'-'+j,estudianteId:id,actividadId:activityIds[j],rol:'participante',horasRealizadas:hours,horasPropuestas:hours,horasValidadasDemo:hours,estadoValidacion:'validado',referenciaEvidencia:'Informe sintético '+id+' · sin validez institucional',fechaRegistro:date,fechaValidacion:date,sintetico:true});});
  }
  db.demoPopulationVersion=5;
  return true;
}


function demoHours(i){const total=i<10?[10,9,8,8,7,7,6,6,5,5][i]:1+(i*7)%4;const a=Math.ceil(total*.4),b=Math.floor(total*.3);return [a,b,total-a-b];}


