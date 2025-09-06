-- Seed default notification templates
insert into public.notification_templates (key, title, body, active, channel, schedule_kind) values
  ('reminder_evening', 'תזכורת לתור מחר אצל {barber_name}', '{first_name}, רק תזכורת ידידותית — מחר ב-{appointment_time}. '
   || 'מחכים לך ב{business_name}!', true, 'push', 'evening'),
  ('reminder_morning', 'התור שלך היום ב-{appointment_time}', '{first_name}, נתראה היום אצל {barber_name} בשעה {appointment_time}. '
   || 'אם צריך לשנות — אנא עדכן/י מראש.', true, 'push', 'morning'),
  ('reminder_three_hours', 'עוד 3 שעות לתור שלך', '{first_name}, מזכירים בעדינות — התור אצל {barber_name} יחל בעוד 3 שעות ({appointment_time}).', true, 'push', 'three_hours'),
  ('admin_manual', 'הודעה חדשה מ{business_name}', '', true, 'push', 'manual')
on conflict (key) do nothing;
