export const approvalLabels={pendiente:'Pendiente de aprobación',aprobada:'Aprobada en demo',rechazada:'Rechazada por directivo'};

export function approvalOf(activity){return activity?.aprobacion?.estado||'pendiente';}

export function decideActivity(db,activityId,decision,comment,actorRole){
  if(actorRole!=='directivo')throw Error('Solo el perfil directivo puede aprobar o rechazar actividades.');
  const activity=db.actividades.find(a=>a.id===activityId);
  if(!activity||approvalOf(activity)!=='pendiente')throw Error('La actividad no está pendiente de aprobación.');
  if(!['aprobada','rechazada'].includes(decision))throw Error('Decisión inválida.');
  const comentario=String(comment||'').trim();
  if(!comentario)throw Error('Escribe una observación o referencia para dejar constancia de la decisión.');
  const fecha=new Date().toISOString();
  activity.aprobacion={estado:decision,comentario,fecha,actor:'Directivo de demostración'};
  db.auditoria.push({id:crypto.randomUUID(),tipo:'aprobacionActividad',actividadId:activityId,antes:'pendiente',despues:decision,comentario,fecha,actor:'Directivo de demostración'});
}

export function resubmitActivity(db,activityId,comment,actorRole){
  if(actorRole!=='organizador')throw Error('Solo el organizador puede reenviar una actividad.');
  const activity=db.actividades.find(a=>a.id===activityId);
  if(!activity||approvalOf(activity)!=='rechazada')throw Error('Solo se pueden reenviar actividades rechazadas.');
  const comentario=String(comment||'').trim();
  if(!comentario)throw Error('Describe la aclaración para solicitar una nueva revisión.');
  const fecha=new Date().toISOString();
  activity.aprobacion={estado:'pendiente',comentario,fecha,actor:'Organizador de demostración'};
  db.auditoria.push({id:crypto.randomUUID(),tipo:'aprobacionActividad',actividadId:activityId,antes:'rechazada',despues:'pendiente',comentario,fecha,actor:'Organizador de demostración'});
}
