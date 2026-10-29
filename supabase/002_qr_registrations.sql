begin;
create table if not exists public.epx_registrations (
 id uuid primary key default gen_random_uuid(),
 student_id text not null references public.epx_students(id),
 activity_id text not null references public.epx_activities(id),
 user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(student_id,activity_id)
);
create index if not exists epx_registrations_activity_idx on public.epx_registrations(activity_id);
alter table public.epx_registrations enable row level security;
revoke all on public.epx_registrations from anon,authenticated;

create or replace function public.epx_enroll(activity_id text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare profile public.epx_profiles; activity public.epx_activities; registration public.epx_registrations; added boolean;
begin
 select * into profile from public.epx_profiles where user_id=auth.uid();
 if profile.user_id is null or profile.role<>'estudiante' or profile.student_id is null then
  raise exception 'Solo los estudiantes autenticados pueden inscribirse' using errcode='42501';
 end if;
 select * into activity from public.epx_activities a where a.id=epx_enroll.activity_id for share;
 if activity.id is null then raise exception 'No se encontró la actividad';end if;
 if activity.data->'aprobacion'->>'estado'<>'aprobada' then raise exception 'La actividad aún no está aprobada por un directivo';end if;
 if activity.data->>'estado' not in ('planificada','en curso') then raise exception 'Las inscripciones de esta actividad están cerradas';end if;
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
 'inscripciones',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'actividadId',r.activity_id,'estudianteId',r.student_id,'fechaRegistro',r.created_at) order by r.created_at)
 from public.epx_registrations r join public.epx_activities a on a.id=r.activity_id
 where (profile.role='estudiante' and r.student_id=profile.student_id) or (profile.role='organizador' and a.owner_id=profile.user_id) or profile.role='directivo'),'[]'::jsonb),
 'auditoria',case when profile.role='estudiante' then '[]'::jsonb else coalesce((select jsonb_agg(data order by created_at) from public.epx_audit),'[]'::jsonb) end);
end $$;
revoke all on function public.epx_enroll(text) from public,anon;
grant execute on function public.epx_enroll(text) to authenticated;
notify pgrst,'reload schema';
commit;

