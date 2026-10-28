-- iTech Careers / Recruitment applications
create extension if not exists pgcrypto;
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  mobile text not null check (char_length(mobile) between 7 and 20),
  email text,
  applying_for text not null,
  address text not null,
  qualification text not null,
  experience text,
  skills text,
  resume_path text not null,
  status text not null default 'New' check (status in ('New','Under Review','Shortlisted','Interview','Selected','Rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.career_applications enable row level security;
drop policy if exists career_applications_public_insert on public.career_applications;
create policy career_applications_public_insert on public.career_applications for insert to anon, authenticated
with check (status = 'New' and admin_notes is null);
drop policy if exists career_applications_admin_select on public.career_applications;
create policy career_applications_admin_select on public.career_applications for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists career_applications_admin_update on public.career_applications;
create policy career_applications_admin_update on public.career_applications for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('career-resumes','career-resumes',false,5242880,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream'])
on conflict (id) do update set public=false,file_size_limit=5242880;
drop policy if exists career_resume_public_upload on storage.objects;
create policy career_resume_public_upload on storage.objects for insert to anon, authenticated
with check (bucket_id = 'career-resumes' and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$');
drop policy if exists career_resume_admin_read on storage.objects;
create policy career_resume_admin_read on storage.objects for select to authenticated
using (bucket_id = 'career-resumes' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists career_resume_admin_delete on storage.objects;
create policy career_resume_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'career-resumes' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
