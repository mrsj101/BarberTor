create extension if not exists "pgcrypto";

create table if not exists reminder_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  status text not null,
  sent_at timestamptz not null default now()
);

alter table reminder_logs enable row level security;

create policy "Admins can read reminder_logs"
  on reminder_logs
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
