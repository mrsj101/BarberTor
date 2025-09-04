# Welcome to your Dyad app

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
3. Save the keys in your environment (Base64URL encoded without padding or whitespace):
   ```bash
   # .env.local
   VITE_VAPID_PUBLIC_KEY=<base64url_public_key>

   # Supabase function secrets
   VAPID_PUBLIC_KEY=<base64url_public_key>
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
