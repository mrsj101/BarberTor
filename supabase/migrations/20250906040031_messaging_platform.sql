-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('fcm','vapid')),
  token_or_subscription jsonb not null,
  device_info jsonb,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create notification_templates table
create table if not exists public.notification_templates (
  key text primary key,
  title text not null,
  body text not null,
  active boolean default true,
  channel text default 'push',
  schedule_kind text check (schedule_kind in ('evening','morning','three_hours','manual')) default 'manual'
);

alter table public.notification_templates enable row level security;

create policy "Admins manage notification templates" on public.notification_templates
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Create notifications table
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  template_key text references public.notification_templates(key),
  title text not null,
  body text not null,
  payload_json jsonb,
  status text not null check (status in ('queued','sent','failed')) default 'queued',
  error text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table public.notifications enable row level security;

create policy "Users view own notifications" on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "Service role inserts notifications" on public.notifications
  for insert
  with check (true);

-- Create reminders_queue table
create table if not exists public.reminders_queue (
  id bigint generated always as identity primary key,
  appointment_id uuid references public.appointments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  due_at timestamptz not null,
  kind text not null check (kind in ('evening','morning','three_hours')),
  status text not null check (status in ('pending','sent','failed')) default 'pending'
);

alter table public.reminders_queue enable row level security;

create policy "Service role manages reminders_queue" on public.reminders_queue
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
