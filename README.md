# Welcome to your Dyad app

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
