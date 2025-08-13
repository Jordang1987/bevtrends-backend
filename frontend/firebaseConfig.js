// firebaseConfig.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDbWEuFr_VeTfK-3qA8B5DJZOB980yjheY",
  authDomain: "bevtrends-e701a.firebaseapp.com",
  projectId: "bevtrends-e701a",
  storageBucket: "bevtrends-e701a.appspot.com", // ✅ Correct
  messagingSenderId: "26554516330",
  appId: "1:26554516330:web:530cf41ccb2770cc911b13",
  measurementId: "G-BJ8XZCE6W3",
};

// ✅ Initialize Firebase app once
export const app = initializeApp(firebaseConfig);

// ✅ Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Storage reference
export const storage = getStorage(app);
