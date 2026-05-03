import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHRp12cNBZlE1YkgennvVTjeOcDxp2LaI",
  authDomain: "cabsync-90fb7.firebaseapp.com",
  projectId: "cabsync-90fb7",
  storageBucket: "cabsync-90fb7.firebasestorage.app",
  messagingSenderId: "375011515483",
  appId: "1:375011515483:web:67637cb8ee169f0fe6337e",
  measurementId: "G-LCS9RZNHRG"
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // The current browser doesn't support all of the features required to enable persistence
        console.warn('Firestore persistence not supported by browser');
    }
});

export default app;
