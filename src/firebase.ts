import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web app's Firebase configuration from the user
const firebaseConfig = {
  apiKey: "AIzaSyAl7eUn1TAfbdQ2TL21HVjAhE04GerJiiU",
  authDomain: "bidlens-e3b21.firebaseapp.com",
  projectId: "bidlens-e3b21",
  storageBucket: "bidlens-e3b21.firebasestorage.app",
  messagingSenderId: "604169622401",
  appId: "1:604169622401:web:94997397478adb8a7ece80",
  measurementId: "G-2CPWS1J7QY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
