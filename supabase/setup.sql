-- Run once in the SQL Editor of the new WorkHub Supabase project.
-- All records and files are private to the authenticated owner.

create table if not exists public.workhub_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'task', 'client', 'lead', 'project', 'payment', 'expected_payment',
    'expense', 'tax', 'debt', 'content', 'reference', 'material',
    'estimate', 'price_item'
  )),
  data jsonb not null default '{}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workhub_records_owner_updated_idx
  on public.workhub_records (owner_id, updated_at desc);

alter table public.workhub_records enable row level security;

drop policy if exists "Owner reads own WorkHub records" on public.workhub_records;
create policy "Owner reads own WorkHub records"
  on public.workhub_records for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Owner creates own WorkHub records" on public.workhub_records;
create policy "Owner creates own WorkHub records"
  on public.workhub_records for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner updates own WorkHub records" on public.workhub_records;
create policy "Owner updates own WorkHub records"
  on public.workhub_records for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner deletes own WorkHub records" on public.workhub_records;
create policy "Owner deletes own WorkHub records"
  on public.workhub_records for delete to authenticated
  using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.workhub_records to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('workhub-files', 'workhub-files', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;

drop policy if exists "Owner reads own WorkHub files" on storage.objects;
create policy "Owner reads own WorkHub files"
  on storage.objects for select to authenticated
  using (bucket_id = 'workhub-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Owner uploads own WorkHub files" on storage.objects;
create policy "Owner uploads own WorkHub files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'workhub-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Owner updates own WorkHub files" on storage.objects;
create policy "Owner updates own WorkHub files"
  on storage.objects for update to authenticated
  using (bucket_id = 'workhub-files' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'workhub-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Owner deletes own WorkHub files" on storage.objects;
create policy "Owner deletes own WorkHub files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'workhub-files' and (storage.foldername(name))[1] = (select auth.uid()::text));
