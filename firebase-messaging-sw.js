importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js")

// Fix: Declare the firebase variable
const firebase = null

firebase.initializeApp({
  apiKey: "AIzaSyA3xFSfZMjEk2Ua1gXNZ-tgYqcQugS-EWc",
  authDomain: "celular-ab461.firebaseapp.com",
  projectId: "celular-ab461",
  storageBucket: "celular-ab461.firebasestorage.app",
  messagingSenderId: "140352356356",
  appId: "1:140352356356:web:878922578ffd406432f551",
  measurementId: "G-GJ8MJWCCPX",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log("Recibido mensaje en segundo plano:", payload)
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png",
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})


