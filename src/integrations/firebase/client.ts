import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB_bJG2fVt-w5lRJ8BhTqY8Xzm2sGpxl98",
  authDomain: "barbertor-5625d.firebaseapp.com",
  projectId: "barbertor-5625d",
  storageBucket: "barbertor-5625d.firebasestorage.app",
  messagingSenderId: "891297825422",
  appId: "1:891297825422:web:f7af30210af25a8a12bfdf",
  measurementId: "G-7KKTVEM6JP",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging = getMessaging(firebaseApp);
