/**
 * LifeTap: Smart Emergency ID
 * Authentication Service (Firebase Auth with Seamless Local Fallback)
 */

import { getFirebaseAuth, localDb, showToast } from './firebase-config.js';

export const authService = {
  // Sign up new user
  async register(email, password, displayName) {
    const auth = getFirebaseAuth();
    if (auth) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
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
    const auth = getFirebaseAuth();
    if (auth) {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    } else {
      return await localDb.signIn(email, password);
    }
  },

  // Logout
  async logout() {
    const auth = getFirebaseAuth();
    if (auth) {
      await auth.signOut();
    } else {
      await localDb.signOut();
    }
  },

  // Send password reset email
  async resetPassword(email) {
    const auth = getFirebaseAuth();
    if (auth) {
      await auth.sendPasswordResetEmail(email);
    } else {
      // Local fallback simulation
      await new Promise(r => setTimeout(r, 600));
      return true;
    }
  },

  // Get current user synchronously or asynchronously
  getCurrentUser() {
    const auth = getFirebaseAuth();
    if (auth) {
      return auth.currentUser;
    }
    return localDb.getCurrentUser();
  },

  // Observer for auth state changes
  onAuthStateChanged(callback) {
    const auth = getFirebaseAuth();
    if (auth) {
      return auth.onAuthStateChanged(user => {
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
