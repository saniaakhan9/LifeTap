/**
 * LifeTap: Smart Emergency ID
 * Authentication Service (Firebase Auth with Seamless Local Fallback)
 */

import { firebaseConfig, isLiveFirebaseConfigured, localDb, showToast } from './firebase-config.js';

let authInstance = null;

// Initialize Firebase Auth if live keys exist
if (isLiveFirebaseConfigured() && window.firebase) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    authInstance = firebase.auth();
  } catch (err) {
    console.error("Firebase auth initialization error:", err);
  }
}

export const authService = {
  // Sign up new user
  async register(email, password, displayName) {
    if (authInstance) {
      const cred = await authInstance.createUserWithEmailAndPassword(email, password);
      if (displayName && cred.user) {
        await cred.user.updateProfile({ displayName });
      }
      return cred.user;
    } else {
      return await localDb.signUp(email, password, displayName);
    }
  },

  // Login existing user
  async login(email, password) {
    if (authInstance) {
      const cred = await authInstance.signInWithEmailAndPassword(email, password);
      return cred.user;
    } else {
      return await localDb.signIn(email, password);
    }
  },

  // Logout
  async logout() {
    if (authInstance) {
      await authInstance.signOut();
    } else {
      await localDb.signOut();
    }
  },

  // Send password reset email
  async resetPassword(email) {
    if (authInstance) {
      await authInstance.sendPasswordResetEmail(email);
    } else {
      // Local fallback simulation
      await new Promise(r => setTimeout(r, 600));
      return true;
    }
  },

  // Get current user synchronously or asynchronously
  getCurrentUser() {
    if (authInstance) {
      return authInstance.currentUser;
    }
    return localDb.getCurrentUser();
  },

  // Observer for auth state changes
  onAuthStateChanged(callback) {
    if (authInstance) {
      return authInstance.onAuthStateChanged(user => {
        callback(user);
      });
    } else {
      const user = localDb.getCurrentUser();
      callback(user);
      // Return dummy unsubscribe function
      return () => {};
    }
  },

  // Guard: Redirect to auth page if not logged in
  requireAuth(redirectUrl = 'auth.html') {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = redirectUrl;
    }
    return user;
  }
};
