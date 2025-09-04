-- Allow administrators full access to notification_settings table
create policy "Admins can manage notification_settings"
  on notification_settings
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
