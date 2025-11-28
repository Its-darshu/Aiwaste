import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDboF6AIPbxhuMpA8Pue8z7dC2cjXkpdgM",
  authDomain: "waste-report-c646f.firebaseapp.com",
  projectId: "waste-report-c646f",
  storageBucket: "waste-report-c646f.firebasestorage.app",
  messagingSenderId: "336328681545",
  appId: "1:336328681545:web:c113e4899e61a4e2b1f798",
  measurementId: "G-K0MCSYTTYT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
