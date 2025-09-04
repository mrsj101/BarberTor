alter table business_settings
  add column evening_reminder_time time,
  add column evening_reminder_message text,
  add column morning_reminder_start_time time,
  add column morning_reminder_end_time time,
  add column morning_reminder_message text,
  add column three_hours_reminder_time time,
  add column three_hours_reminder_message text;
