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
create index if not exists staff_points_staff_date_idx on public.staff_points(staff_id,work_date desc);
alter table public.staff_points enable row level security;
drop policy if exists staff_points_select on public.staff_points;
create policy staff_points_select on public.staff_points for select to authenticated using (
 staff_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role,'')) in ('admin','administrator'))
);
drop policy if exists staff_points_admin_write on public.staff_points;
create policy staff_points_admin_write on public.staff_points for all to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role,'')) in ('admin','administrator'))
) with check (
 exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role,'')) in ('admin','administrator'))
);

create or replace function public.award_daily_work_points(p_entry_id uuid) returns numeric
language plpgsql security definer set search_path=public as $$
declare r record; staff uuid; service_total numeric:=0; eligible numeric; pts numeric;
begin
 select * into r from public.daily_work_entries where id=p_entry_id;
 if not found then raise exception 'Daily work entry not found'; end if;
 staff:=coalesce(r.created_by,auth.uid());
 if staff is null then raise exception 'Staff user could not be determined'; end if;
 -- Services selected in Quick Entry are stored inside Other Works; remove them from point eligibility.
 select coalesce(sum(total_amount),0) into service_total from public.daily_work_entry_services where work_entry_id=r.id;
 eligible:=greatest(coalesce(r.e_filing,0)+coalesce(r.print_amount,0)+coalesce(r.scanning,0)+coalesce(r.other_works,0)-service_total,0);
 pts:=round(eligible*.10,2);
 if pts<=0 then return 0; end if;
 insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
 values(staff,pts,'Quick Entry','daily_work',r.id,coalesce(r.work_date,current_date),'10% of E-Filing + Print + Scanning + Other Works',auth.uid())
 on conflict(source_type,source_id) do nothing;
 return pts;
end; $$;

grant execute on function public.award_daily_work_points(uuid) to authenticated;

create or replace function public.award_insurance_points(p_insurance_id uuid) returns numeric
language plpgsql security definer set search_path=public as $$
declare r record; staff uuid;
begin
 select * into r from public.vehicle_insurance where id=p_insurance_id;
 if not found then raise exception 'Insurance record not found'; end if;
 staff:=coalesce(r.created_by,auth.uid());
 insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
 values(staff,10,'Insurance Update','insurance',r.id,coalesce(r.created_at::date,current_date),'Vehicle insurance update',auth.uid())
 on conflict(source_type,source_id) do nothing;
 return 10;
end; $$;
grant execute on function public.award_insurance_points(uuid) to authenticated;

create or replace function public.award_service_job_points(p_job_id uuid,p_points numeric) returns numeric
language plpgsql security definer set search_path=public as $$
declare r record; ok boolean; pts numeric;
begin
 select exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role,'')) in ('admin','administrator')) into ok;
 if not ok then raise exception 'Only admin can award service job points'; end if;
 select * into r from public.service_jobs where id=p_job_id;
 if not found then raise exception 'Service job not found'; end if;
 if r.technician_id is null then raise exception 'Assign a staff member first'; end if;
 pts:=greatest(coalesce(p_points,0),0);
 insert into public.staff_points(staff_id,points,point_type,source_type,source_id,work_date,description,created_by)
 values(r.technician_id,pts,'Service Job Card','service_job',r.id,coalesce(r.created_at::date,current_date),'Admin awarded service job points',auth.uid())
 on conflict(source_type,source_id) do update set points=excluded.points,description=excluded.description,created_by=excluded.created_by;
 return pts;
end; $$;
grant execute on function public.award_service_job_points(uuid,numeric) to authenticated;
