import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKey_ReplaceWithYourOwn",
  authDomain: "hr-recruitment-tracker-419b6.firebaseapp.com",
  databaseURL: "https://hr-recruitment-tracker-419b6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hr-recruitment-tracker-419b6",
  storageBucket: "hr-recruitment-tracker-419b6.appspot.com",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
