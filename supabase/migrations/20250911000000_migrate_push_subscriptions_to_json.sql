alter table push_subscriptions
  add column if not exists subscription jsonb;

update push_subscriptions
set subscription = jsonb_build_object(
  'endpoint', endpoint,
  'keys', jsonb_build_object('p256dh', p256dh, 'auth', auth)
)
where subscription is null;

alter table push_subscriptions drop column if exists endpoint;
alter table push_subscriptions drop column if exists p256dh;
alter table push_subscriptions drop column if exists auth;
