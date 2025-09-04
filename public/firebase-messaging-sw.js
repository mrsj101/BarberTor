import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseConfig } from "../src/integrations/firebase/config";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  self.registration.showNotification(payload.notification?.title ?? "", {
    body: payload.notification?.body,
    icon: "/icon-192.png",
  });
});
