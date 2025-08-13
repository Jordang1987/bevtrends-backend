import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig"; // ✅ Import from single source

WebBrowser.maybeCompleteAuthSession();

// ✅ Create context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 🔹 Email/Password Registration
  const register = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  // 🔹 Email/Password Login
  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  // 🔹 Google Login (Expo Go + iOS build + Web)
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "26554516330-053vq5rj0gq1v1hoog83g0frcq76l5k2.apps.googleusercontent.com", // iOS Expo Go
    iosClientId:
      "26554516330-053vq5rj0gq1v1hoog83g0frcq76l5k2.apps.googleusercontent.com", // iOS build
    webClientId:
      "26554516330-053vq5rj0gq1v1hoog83g0frcq76l5k2.apps.googleusercontent.com", // Web
  });

  const loginWithGoogle = () => {
    promptAsync();
  };

  // ✅ Listen for Google auth result
  useEffect(() => {
    const signInWithGoogle = async () => {
      try {
        if (
          response?.type === "success" &&
          response.authentication?.accessToken
        ) {
          const credential = GoogleAuthProvider.credential(
            null,
            response.authentication.accessToken
          );
          await signInWithCredential(auth, credential);
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
      }
    };
    signInWithGoogle();
  }, [response]);

  // 🔹 Logout
  const logout = async () => {
    await signOut(auth);
  };

  // ✅ Track current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingInitial(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        loginWithGoogle,
        logout,
        loadingInitial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
