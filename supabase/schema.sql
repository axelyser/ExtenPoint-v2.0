begin;
create table if not exists public.epx_students (
 id text primary key, data jsonb not null,
 check(data->>'id'=id),check(length(trim(data->>'nombre'))>0),
 check((data->>'semestre')::int between 1 and 20)
);
create table if not exists public.epx_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('estudiante','organizador','directivo')),
 nombre text not null, student_id text references public.epx_students(id),
 check(role<>'estudiante' or student_id is not null),unique(student_id)
);
create table if not exists public.epx_activities (
 id text primary key, data jsonb not null, owner_id uuid not null references public.epx_profiles(user_id),
 check(data->>'id'=id),check((data->>'lineaAccion')::int between 0 and 6),
 check((data->>'duracionHoras')::numeric>0 and (data->>'duracionHoras')::numeric=trunc((data->>'duracionHoras')::numeric)),
 check(data->'aprobacion'->>'estado' in ('pendiente','aprobada','rechazada'))
);
create table if not exists public.epx_participations (
 id text primary key, student_id text not null references public.epx_students(id),
 activity_id text not null references public.epx_activities(id),data jsonb not null,
 unique(student_id,activity_id),check(data->>'id'=id),
 check(data->>'estudianteId'=student_id and data->>'actividadId'=activity_id),
 check(data->>'rol' in ('participante','organizador')),
 check(data->>'estadoValidacion' in ('pendiente','validado','rechazado')),
 check((data->>'horasRealizadas')::numeric>=0 and (data->>'horasRealizadas')::numeric=trunc((data->>'horasRealizadas')::numeric)),
 check((data->>'horasPropuestas')::numeric>=0 and (data->>'horasPropuestas')::numeric=trunc((data->>'horasPropuestas')::numeric)),
 check((data->>'horasValidadasDemo')::numeric>=0 and (data->>'horasValidadasDemo')::numeric=trunc((data->>'horasValidadasDemo')::numeric)),
 check((data->>'horasValidadasDemo')::numeric=case when data->>'estadoValidacion'='validado' then (data->>'horasPropuestas')::numeric else 0 end)
);
create index if not exists epx_participations_student_idx on public.epx_participations(student_id);
create index if not exists epx_participations_activity_idx on public.epx_participations(activity_id);
do $$begin
 alter table public.epx_participations add constraint epx_hours_required check(coalesce(
 jsonb_typeof(data->'horasRealizadas')='number' and jsonb_typeof(data->'horasPropuestas')='number' and jsonb_typeof(data->'horasValidadasDemo')='number'
 and jsonb_typeof(data->'rol')='string' and jsonb_typeof(data->'estadoValidacion')='string',false));
exception when duplicate_object then null;end $$;
do $$begin
 alter table public.epx_students add constraint epx_student_required check(coalesce(jsonb_typeof(data->'nombre')='string' and jsonb_typeof(data->'carrera')='string' and jsonb_typeof(data->'semestre')='number' and (data->>'semestre')::numeric=trunc((data->>'semestre')::numeric),false));
exception when duplicate_object then null;end $$;
do $$begin
 alter table public.epx_activities add constraint epx_activity_required check(coalesce(jsonb_typeof(data->'duracionHoras')='number' and jsonb_typeof(data->'lineaAccion')='number' and (data->>'lineaAccion')::numeric=trunc((data->>'lineaAccion')::numeric) and jsonb_typeof(data->'aprobacion'->'estado')='string',false));
exception when duplicate_object then null;end $$;
create table if not exists public.epx_audit (id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), data jsonb not null,created_at timestamptz not null default now());
alter table public.epx_students enable row level security;
alter table public.epx_profiles enable row level security;
alter table public.epx_activities enable row level security;
alter table public.epx_participations enable row level security;
alter table public.epx_audit enable row level security;
revoke all on public.epx_students,public.epx_profiles,public.epx_activities,public.epx_participations,public.epx_audit from anon,authenticated;
grant select on public.epx_profiles to authenticated;
drop policy if exists own_profile on public.epx_profiles;
create policy own_profile on public.epx_profiles for select to authenticated using(user_id=auth.uid());

create or replace function public.epx_state() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles;
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null then raise exception 'Cuenta sin perfil de ExtenPoint' using errcode='42501'; end if;
 return jsonb_build_object('version',1,'demoPopulationVersion',5,
 'ownedActivityIds',coalesce((select jsonb_agg(id) from public.epx_activities where owner_id=profile.user_id),'[]'::jsonb),
 'estudiantes',coalesce((select jsonb_agg(data order by id) from public.epx_students),'[]'::jsonb),
 'actividades',coalesce((select jsonb_agg(data order by id) from public.epx_activities),'[]'::jsonb),
 'participaciones',coalesce((select jsonb_agg(case when profile.role='estudiante' and student_id<>profile.student_id then data||jsonb_build_object('referenciaEvidencia','Referencia reservada al titular y organizadores') else data end order by id) from public.epx_participations),'[]'::jsonb),
 'auditoria',case when profile.role='estudiante' then '[]'::jsonb else coalesce((select jsonb_agg(data order by created_at) from public.epx_audit),'[]'::jsonb) end);
end $$;

create or replace function public.epx_apply(operations jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles; op jsonb; d jsonb; old jsonb; a public.epx_activities; entity text; item_id text; new_status text; old_status text; entry jsonb; stamp text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null or profile.role='estudiante' then raise exception 'Tu rol no permite modificar estos registros' using errcode='42501'; end if;
 if jsonb_typeof(operations)<>'array' or jsonb_array_length(operations)<>1 then raise exception 'Envía una operación por transacción'; end if;
 for op in select value from jsonb_array_elements(operations) loop
  if not(op ?& array['collection','before','after']) or jsonb_typeof(op->'after')<>'object' then raise exception 'Operación incompleta';end if;
  d:=op->'after';item_id:=d->>'id';entity:=op->>'collection';entry:=null;
  if item_id is null or length(item_id)>200 then raise exception 'Identificador inválido';end if;
  if entity='estudiantes' then
   if profile.role<>'organizador' or op->'before'<>'null'::jsonb then raise exception 'Solo el organizador registra estudiantes nuevos';end if;
   if length(trim(coalesce(d->>'nombre','')))=0 or length(trim(coalesce(d->>'carrera','')))=0 then raise exception 'Nombre y carrera obligatorios';end if;
   insert into public.epx_students values(item_id,d);
   entry:=jsonb_build_object('tipo','registroEstudiante','estudianteId',item_id,'despues','registrado');
  elsif entity='actividades' then
   select * into a from public.epx_activities where id=item_id for update;
   if not found then
    if profile.role<>'organizador' or op->'before'<>'null'::jsonb then raise exception 'Solo el organizador crea actividades';end if;
    if d->'aprobacion'->>'estado'<>'pendiente' then raise exception 'Una actividad nueva debe quedar pendiente';end if;
    if coalesce(length(trim(d->>'nombre')),0)=0 or coalesce(length(trim(d->>'descripcion')),0)=0 or coalesce(length(trim(d->>'organizador')),0)=0 or coalesce(length(trim(d->'reglaAcreditacion'->>'regla')),0)=0 then raise exception 'Completa los datos y la regla provisional';end if;
    perform (d->>'fecha')::date;
    if d->>'modalidad' not in ('presencial','virtual') or d->>'estado' not in ('planificada','en curso','finalizada') or d->'reglaAcreditacion'->>'rol' not in ('participante','organizador','ambos') then raise exception 'Clasificación de actividad inválida';end if;
    if jsonb_typeof(d->'reglaAcreditacion'->'limite')<>'null' and ((d->'reglaAcreditacion'->>'limite')::numeric<0 or (d->'reglaAcreditacion'->>'limite')::numeric<>trunc((d->'reglaAcreditacion'->>'limite')::numeric)) then raise exception 'Límite inválido';end if;
    d:=jsonb_set(d,'{aprobacion}',jsonb_build_object('estado','pendiente','comentario','','fecha',null,'actor',null));
    insert into public.epx_activities values(item_id,d,profile.user_id);
    entry:=jsonb_build_object('tipo','registroActividad','actividadId',item_id,'despues','pendiente');
   else
    old:=a.data;if old<>op->'before' then raise exception 'El registro cambió en otro dispositivo. Actualiza y vuelve a intentar' using errcode='P0001';end if;
    if (old-'aprobacion')<>(d-'aprobacion') then raise exception 'Esta operación solo permite cambiar la aprobación';end if;
    old_status:=old->'aprobacion'->>'estado';new_status:=d->'aprobacion'->>'estado';
    if coalesce(length(trim(d->'aprobacion'->>'comentario')),0)=0 then raise exception 'La observación es obligatoria';end if;
    if profile.role='directivo' then
     if old_status<>'pendiente' or new_status not in ('aprobada','rechazada') then raise exception 'Transición de aprobación inválida';end if;
    elsif profile.role='organizador' then
     if a.owner_id<>profile.user_id or old_status<>'rechazada' or new_status<>'pendiente' then raise exception 'Solo puedes reenviar tus actividades rechazadas';end if;
    else raise exception 'Rol no autorizado';end if;
    d:=jsonb_set(d,'{aprobacion,actor}',to_jsonb(profile.nombre));d:=jsonb_set(d,'{aprobacion,fecha}',to_jsonb(stamp));
    update public.epx_activities set data=d where id=item_id;
    entry:=jsonb_build_object('tipo','aprobacionActividad','actividadId',item_id,'antes',old_status,'despues',new_status,'comentario',d->'aprobacion'->>'comentario');
   end if;
  elsif entity='participaciones' then
   if profile.role<>'organizador' then raise exception 'Solo el organizador gestiona participaciones';end if;
   select * into a from public.epx_activities where id=d->>'actividadId' for share;
   if a.id is null or a.owner_id<>profile.user_id then raise exception 'Solo puedes registrar y revisar asistencias de tus actividades';end if;
   select data into old from public.epx_participations where id=item_id for update;
   if not found then
    if op->'before'<>'null'::jsonb or d->>'estadoValidacion'<>'pendiente' or (d->>'horasValidadasDemo')::numeric<>0 then raise exception 'Una participación nueva debe quedar pendiente';end if;
    if a.data->'aprobacion'->>'estado'<>'aprobada' then raise exception 'La actividad aún no está aprobada';end if;
    if a.data->'reglaAcreditacion'->>'rol'<>'ambos' and a.data->'reglaAcreditacion'->>'rol'<>d->>'rol' then raise exception 'Rol incompatible con la regla';end if;
    if (d->>'horasRealizadas')::numeric>(a.data->>'duracionHoras')::numeric then raise exception 'Horas realizadas mayores que la duración';end if;
    if jsonb_typeof(a.data->'reglaAcreditacion'->'limite')<>'null' and (d->>'horasPropuestas')::numeric>(a.data->'reglaAcreditacion'->>'limite')::numeric then raise exception 'Supera el límite de la actividad';end if;
    d:=jsonb_set(d,'{fechaRegistro}',to_jsonb(stamp));d:=jsonb_set(d,'{fechaValidacion}','null'::jsonb);
    insert into public.epx_participations values(item_id,d->>'estudianteId',d->>'actividadId',d);
    entry:=jsonb_build_object('tipo','registroParticipacion','participacionId',item_id,'despues','pendiente');
   else
    if old<>op->'before' then raise exception 'El registro cambió en otro dispositivo. Actualiza y vuelve a intentar' using errcode='P0001';end if;
    if (old-array['estadoValidacion','horasValidadasDemo','fechaValidacion'])<>(d-array['estadoValidacion','horasValidadasDemo','fechaValidacion']) then raise exception 'No se permite alterar los datos de la asistencia durante la revisión';end if;
    new_status:=d->>'estadoValidacion';
    if new_status='validado' and (a.data->'aprobacion'->>'estado'<>'aprobada' or length(trim(coalesce(d->>'referenciaEvidencia','')))=0) then raise exception 'Se necesita actividad aprobada y evidencia para validar';end if;
    d:=jsonb_set(d,'{fechaValidacion}',to_jsonb(stamp));
    update public.epx_participations set data=d where id=item_id;
    entry:=jsonb_build_object('tipo','revisionParticipacion','participacionId',item_id,'antes',old->>'estadoValidacion','despues',new_status);
   end if;
  else raise exception 'Colección no autorizada';end if;
  if entry is not null then
   entry:=entry||jsonb_build_object('id',gen_random_uuid(),'actor',profile.nombre,'fecha',stamp);
   insert into public.epx_audit(actor_id,data) values(profile.user_id,entry);
  end if;
 end loop;
 return public.epx_state();
end $$;
revoke all on function public.epx_state(),public.epx_apply(jsonb) from public,anon;
grant execute on function public.epx_state(),public.epx_apply(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;

