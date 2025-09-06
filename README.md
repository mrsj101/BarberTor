# Welcome to your Dyad app

This project is a PWA for managing barbershop appointments built with React, Vite and Supabase.
The sections below outline storage usage and the new cross-platform messaging setup.

## Supabase Storage

Uploaded files are stored in the `BarberTor` bucket on Supabase Storage.

Use the helper functions to upload files and get their public URLs:

```ts
import { uploadFile, getPublicUrl } from '@/integrations/supabase/storage';

const path = `example/${file.name}`;
await uploadFile('BarberTor', path, file);
const publicUrl = getPublicUrl('BarberTor', path);
```

## Push Notifications

### Generate VAPID keys

1. Install the [`web-push`](https://github.com/web-push-libs/web-push) utility if you don't have it:
   ```bash
   npm install -g web-push
   ```
2. Generate a key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```
3. Save the keys in your environment:
   ```bash
   # .env.local
   VITE_VAPID_PUBLIC_KEY=<public_key>

   # Supabase function secrets
   VAPID_PUBLIC_KEY=<public_key>
   VAPID_PRIVATE_KEY=<private_key>
   ```

### Database setup

1. Create the `push_subscriptions` table and enable RLS:
   ```sql
   create table if not exists public.push_subscriptions (
     id          bigserial primary key,
     user_id     uuid references auth.users not null,
     subscription jsonb not null,
     created_at  timestamptz default now()
   );
   alter table public.push_subscriptions enable row level security;

   -- RLS policies
   create policy "Users manage own subscriptions" on public.push_subscriptions
     for select using (auth.uid() = user_id);
   create policy "Users manage own subscriptions insert" on public.push_subscriptions
     for insert with check (auth.uid() = user_id);
   create policy "Users manage own subscriptions update" on public.push_subscriptions
     for update using (auth.uid() = user_id);
   create policy "Users manage own subscriptions delete" on public.push_subscriptions
     for delete using (auth.uid() = user_id);
   ```
2. Run the migrations:
   ```bash
   supabase db push   # apply to the remote project
   # or for local development
   supabase db reset  # starts a fresh local database with migrations applied
   ```

### Verify delivery

1. Register a push subscription by signing in and allowing notifications in the app.
2. Trigger a notification with the edge function:
   ```bash
   supabase functions invoke send-notification \
     --body '{"title":"Test","body":"Hello","user_ids":["<user-id>"]}' \
     --no-verify-jwt
   ```
3. A `{"success": true}` response and a browser notification confirm the push was sent.
4. For troubleshooting, inspect logs:
   ```bash
   supabase functions logs --name send-notification
   ```

## Messaging Platform – Local Setup

1. **Add push notification icons**

   Place the required icon assets in `public/icons` as:

   - `push-icon-512.png`
   - `push-badge-128.png`

2. **Run database migrations**

   ```bash
   supabase start
   supabase migration up
   ```

3. **Generate VAPID keys**

   ```bash
   deno run supabase/functions/_shared/generateVapid.ts
   ```

   Store the output keys using Supabase secrets:

   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="<public>" VAPID_PRIVATE_KEY="<private>"
   ```

4. **Upload FCM service account JSON**

   ```bash
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
   ```

5. **Deploy Edge Functions**

   ```bash
   supabase functions deploy send-notification --no-verify-jwt
   supabase functions deploy send-appointment-reminders --no-verify-jwt
   ```

6. **Build and preview**

   ```bash
   pnpm build
   pnpm preview
   ```
