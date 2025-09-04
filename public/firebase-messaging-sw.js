importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB_bJG2fVt-w5lRJ8BhTqY8Xzm2sGpxl98",
  authDomain: "barbertor-5625d.firebaseapp.com",
  projectId: "barbertor-5625d",
  storageBucket: "barbertor-5625d.firebasestorage.app",
  messagingSenderId: "891297825422",
  appId: "1:891297825422:web:f7af30210af25a8a12bfdf",
  measurementId: "G-7KKTVEM6JP",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title ?? '', {
    body: payload.notification?.body,
    icon: '/icon-192.png',
  });
});
