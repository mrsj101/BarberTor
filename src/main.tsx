import * as React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './globals.css'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext.tsx'
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ensureBusinessSettings } from "@/lib/initBusinessSettings"

function urlBase64ToUint8Array(base64String: string): Uint8Array | null {
  if (!base64String) {
    console.warn("VAPID public key is missing");
    return null;
  }

  const sanitized = base64String.replace(/\s/g, "");
  const padding = "=".repeat((4 - (sanitized.length % 4)) % 4);
  const base64 = (sanitized + padding).replace(/-/g, "+").replace(/_/g, "/");

  try {
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.warn("Failed to decode VAPID public key", error);
    return null;
  }
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const queryClient = new QueryClient();

ensureBusinessSettings();

let pushInitAttempted = false;

async function initPush() {
  if (pushInitAttempted) {
    return;
  }
  pushInitAttempted = true;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }
    const sw = await navigator.serviceWorker.register("/sw.js");
    const key = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
    if (!key) {
      console.warn("Invalid VAPID key; skipping push subscription");
      return;
    }
    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('push_subscriptions').upsert({
      user_id: user?.id,
      subscription: subscription.toJSON(),
  });
  } catch (error) {
    console.warn("Push notification setup failed", error);
  }
}

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    initPush();
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    initPush();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <SessionProvider>
            <App />
            <Toaster />
            <Sonner richColors />
          </SessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
