alter table public.device_tokens
  add constraint device_tokens_token_unique unique (token);
