create extension if not exists "pgcrypto";

create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  user_ids text[] not null,
  created_at timestamptz default now()
);

alter table notification_settings enable row level security;
