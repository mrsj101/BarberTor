self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

var firebase = self.firebase;
firebase && firebase.initializeApp({});
var messaging = firebase && firebase.messaging();

messaging && messaging.onBackgroundMessage(function (payload) {
  var notif = payload.notification || {};
  self.registration.showNotification(notif.title, {
    body: notif.body,
    icon: notif.icon || '/icons/push-icon-512.png',
    badge: notif.badge || '/icons/push-badge-128.png',
    dir: 'rtl',
    lang: 'he',
    data: { url: notif.click_action }
  });
});

self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data.json(); } catch (e) {}
  var title = data.title || 'הודעה חדשה';
  var body = data.body || '';
  var icon = data.icon || '/icons/push-icon-512.png';
  var badge = data.badge || '/icons/push-badge-128.png';
  var click_action = data.click_action || '/';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: badge,
      dir: 'rtl',
      lang: 'he',
      data: Object.assign({ url: click_action }, data)
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientsArr) {
      for (var i = 0; i < clientsArr.length; i++) {
        var client = clientsArr[i];
        if ('focus' in client) {
          if (client.url.includes(new URL(url, self.location.origin).pathname)) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
