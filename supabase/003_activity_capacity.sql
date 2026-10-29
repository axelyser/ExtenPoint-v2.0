begin;
-- Cupos de demo, siempre con al menos diez lugares disponibles al migrar.
with counts as (select a.id,count(r.id)::int as total from public.epx_activities a left join public.epx_registrations r on r.activity_id=a.id group by a.id)
update public.epx_activities a set data=jsonb_set(a.data,'{cupoMaximo}',to_jsonb(greatest(30,counts.total+10))) from counts where a.id=counts.id and not(a.data ? 'cupoMaximo');
create or replace function public.epx_default_capacity() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if not(new.data ? 'cupoMaximo') then new.data:=jsonb_set(new.data,'{cupoMaximo}','30'::jsonb);end if;
 return new;
end $$;
drop trigger if exists epx_default_capacity on public.epx_activities;
create trigger epx_default_capacity before insert on public.epx_activities for each row execute function public.epx_default_capacity();
do $$begin
 alter table public.epx_activities add constraint epx_capacity_valid check(coalesce(jsonb_typeof(data->'cupoMaximo')='number' and (data->>'cupoMaximo')::numeric between 1 and 10000 and (data->>'cupoMaximo')::numeric=trunc((data->>'cupoMaximo')::numeric),false));
exception when duplicate_object then null;end $$;
create or replace function public.epx_enroll(activity_id text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles; activity public.epx_activities; registration public.epx_registrations; added boolean; enrolled integer;
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null or profile.role<>'estudiante' or profile.student_id is null then
  raise exception 'Solo los estudiantes autenticados pueden inscribirse' using errcode='42501';
 end if;
 select * into activity from public.epx_activities a where a.id=epx_enroll.activity_id for update;
 if activity.id is null then raise exception 'No se encontró la actividad';end if;
 if activity.data->'aprobacion'->>'estado'<>'aprobada' then raise exception 'La actividad aún no está aprobada por un directivo';end if;
 if activity.data->>'estado' not in ('planificada','en curso') then raise exception 'Las inscripciones de esta actividad están cerradas';end if;
 select * into registration from public.epx_registrations r where r.student_id=profile.student_id and r.activity_id=activity.id;
 if found then
  return jsonb_build_object('alreadyRegistered',true,'registration',jsonb_build_object('id',registration.id,'actividadId',registration.activity_id,'estudianteId',registration.student_id,'fechaRegistro',registration.created_at));
 end if;
 select count(*) into enrolled from public.epx_registrations where epx_registrations.activity_id=activity.id;
 if enrolled >= (activity.data->>'cupoMaximo')::int then raise exception 'Cupo completo. Esta actividad no admite más inscripciones.';end if;
 insert into public.epx_registrations(student_id,activity_id,user_id)
 values(profile.student_id,activity.id,profile.user_id)
 on conflict on constraint epx_registrations_student_id_activity_id_key do nothing returning * into registration;
 added:=found;
 if not added then select * into registration from public.epx_registrations r where r.student_id=profile.student_id and r.activity_id=activity.id;end if;
 if added then
  insert into public.epx_audit(actor_id,data) values(profile.user_id,jsonb_build_object('id',gen_random_uuid(),'tipo','inscripcion','actividadId',activity.id,'estudianteId',profile.student_id,'actor',profile.nombre,'fecha',registration.created_at,'despues','inscrito'));
 end if;
 return jsonb_build_object('alreadyRegistered',not added,'registration',jsonb_build_object('id',registration.id,'actividadId',registration.activity_id,'estudianteId',registration.student_id,'fechaRegistro',registration.created_at));
end $$;


create or replace function public.epx_state() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles;
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null then raise exception 'Cuenta sin perfil de ExtenPoint' using errcode='42501';end if;
 return jsonb_build_object('version',1,'demoPopulationVersion',5,
 'ownedActivityIds',coalesce((select jsonb_agg(id) from public.epx_activities where owner_id=profile.user_id),'[]'::jsonb),
 'estudiantes',coalesce((select jsonb_agg(data order by id) from public.epx_students),'[]'::jsonb),
 'actividades',coalesce((select jsonb_agg(data order by id) from public.epx_activities),'[]'::jsonb),
 'participaciones',coalesce((select jsonb_agg(case when profile.role='estudiante' and student_id<>profile.student_id then data||jsonb_build_object('referenciaEvidencia','Referencia reservada al titular y organizadores') else data end order by id) from public.epx_participations),'[]'::jsonb),
 'inscritosPorActividad',coalesce((select jsonb_object_agg(activity_id,total) from (select activity_id,count(*)::int as total from public.epx_registrations group by activity_id) counts),'{}'::jsonb),
 'inscripciones',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'actividadId',r.activity_id,'estudianteId',r.student_id,'fechaRegistro',r.created_at) order by r.created_at)
 from public.epx_registrations r join public.epx_activities a on a.id=r.activity_id
 where (profile.role='estudiante' and r.student_id=profile.student_id) or (profile.role='organizador' and a.owner_id=profile.user_id) or profile.role='directivo'),'[]'::jsonb),
 'auditoria',case when profile.role='estudiante' then '[]'::jsonb else coalesce((select jsonb_agg(data order by created_at) from public.epx_audit),'[]'::jsonb) end);
end $$;

create or replace function public.epx_set_capacity(activity_id text,capacity integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles; activity public.epx_activities; enrolled integer;
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null or profile.role<>'organizador' then raise exception 'Solo el organizador propietario puede cambiar el cupo' using errcode='42501';end if;
 if capacity is null or capacity<1 or capacity>10000 then raise exception 'El cupo debe ser un entero entre 1 y 10000';end if;
 select * into activity from public.epx_activities a where a.id=epx_set_capacity.activity_id for update;
 if activity.id is null or activity.owner_id<>profile.user_id then raise exception 'Solo puedes cambiar el cupo de tus actividades' using errcode='42501';end if;
 select count(*) into enrolled from public.epx_registrations r where r.activity_id=activity.id;
 if capacity<enrolled then raise exception 'El cupo no puede ser menor que la cantidad de inscritos';end if;
 update public.epx_activities set data=jsonb_set(data,'{cupoMaximo}',to_jsonb(capacity)) where id=activity.id;
 insert into public.epx_audit(actor_id,data) values(profile.user_id,jsonb_build_object('id',gen_random_uuid(),'tipo','cupoActividad','actividadId',activity.id,'antes',activity.data->'cupoMaximo','despues',capacity,'actor',profile.nombre,'fecha',now()));
 return public.epx_state();
end $$;
revoke all on function public.epx_set_capacity(text,integer) from public,anon;
grant execute on function public.epx_set_capacity(text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
