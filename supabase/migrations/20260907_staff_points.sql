-- iTech Staff Points System
create table if not exists public.staff_points (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  points numeric(12,2) not null default 0,
  point_type text not null,
  source_type text not null,
  source_id uuid,
  work_date date not null default current_date,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(source_type, source_id)
);

create index if not exists staff_points_staff_date_idx on public.staff_points(staff_id, work_date desc);

alter table public.staff_points enable row level security;

drop policy if exists staff_points_select_own on public.staff_points;
create policy staff_points_select_own on public.staff_points for select to authenticated
using (staff_id = auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create or replace function public.award_daily_work_points(p_entry_id uuid)
returns numeric language plpgsql security definer set search_path=public as $$
declare r record; pts numeric; uid uuid := auth.uid(); already numeric; eligible numeric;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.daily_work_entries where id=p_entry_id;
  if not found then raise exception 'Work entry not found'; end if;
  if exists(select 1 from public.staff_points where source_type='daily_work' and source_id=p_entry_id) then return 0; end if;
  -- Only explicit eligible Quick Entry amounts earn points. E-Payment, Payment and
  -- service selections earn no Quick Entry points.
  eligible := coalesce(r.e_filing,0)+coalesce(r.print_amount,0)+coalesce(r.scanning,0);
  -- other_works contains service totals in the current UI, so subtract saved service
  -- line totals to leave only manually entered Other Works.
  eligible := eligible + greatest(coalesce(r.other_works,0) - coalesce((select sum(total_amount) from public.daily_work_entry_services where work_entry_id=r.id),0),0);
  pts := round(eligible*0.10,2);
  if pts <= 0 then return 0; end if;
  insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
  values(uid,pts,'Quick Entry','daily_work',p_entry_id,coalesce(r.work_date,current_date),'10% of E-Filing + Print + Scanning + Other Works',uid);
  return pts;
end $$;

create or replace function public.award_insurance_points(p_insurance_id uuid)
returns numeric language plpgsql security definer set search_path=public as $$
declare r record; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.vehicle_insurance where id=p_insurance_id;
  if not found then raise exception 'Insurance record not found'; end if;
  if r.created_by is not null and r.created_by <> uid and not exists(select 1 from public.profiles p where p.id=uid and p.role='admin') then
    raise exception 'You cannot award points for this insurance record';
  end if;
  insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
  values(coalesce(r.created_by,uid),10,'Insurance Update','insurance',p_insurance_id,current_date,'Fixed 10 points for insurance update',uid)
  on conflict(source_type,source_id) do nothing;
  return 10;
end $$;

create or replace function public.award_service_job_points(p_job_id uuid, p_staff_id uuid, p_points numeric)
returns numeric language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); r record; pts numeric := greatest(coalesce(p_points,0),0);
begin
  if uid is null or not exists(select 1 from public.profiles p where p.id=uid and p.role='admin') then raise exception 'Admin access required'; end if;
  if pts <= 0 then raise exception 'Enter points greater than zero'; end if;
  select * into r from public.service_jobs where id=p_job_id;
  if not found then raise exception 'Service job not found'; end if;
  if p_staff_id is null then raise exception 'Assigned staff is required'; end if;
  insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
  values(p_staff_id,pts,'Service Job Card','service_job',p_job_id,current_date,'Admin approved service job points',uid)
  on conflict(source_type,source_id) do update set points=excluded.points,created_by=excluded.created_by,description=excluded.description;
  return pts;
end $$;

grant execute on function public.award_daily_work_points(uuid) to authenticated;
grant execute on function public.award_insurance_points(uuid) to authenticated;
grant execute on function public.award_service_job_points(uuid,uuid,numeric) to authenticated;
