import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfSuFfretR4dBJstBBjqQ_ajFbmp9X8vE",
  authDomain: "hpp-umkm-3a820.firebaseapp.com",
  projectId: "hpp-umkm-3a820",
  storageBucket: "hpp-umkm-3a820.firebasestorage.app",
  messagingSenderId: "420889863152",
  appId: "1:420889863152:web:992978858e46229a153335"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
