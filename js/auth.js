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
      if (typeof window !== 'undefined' && window.firebase?.auth?.Auth?.Persistence) {
        try {
          await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
        } catch(e) {}
      }

      // Create new user in Firebase Auth
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (displayName && cred.user) {
        try {
          await cred.user.updateProfile({ displayName });
        } catch(e) {}
      }

      const userObj = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || (cred.user.email ? cred.user.email.split('@')[0] : 'Member')
      };

      // Set session
      localDb.setSession(userObj);

      // Pre-seed a clean, empty initial profile for the new user
      const initialProfile = {
        fullName: displayName || '',
        bloodGroup: '',
        allergies: '',
        conditions: '',
        medications: '',
        emergencyContact1Name: '',
        emergencyContact1Phone: '',
        emergencyContact2Name: '',
        emergencyContact2Phone: '',
        instructions: '',
        isOrganDonor: false,
        updatedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(`lifetap_profile_${cred.user.uid}`, JSON.stringify(initialProfile));
        await localDb.saveUserProfile(cred.user.uid, initialProfile);
      } catch(e) {}

      return cred.user;
    } else {
      return await localDb.signUp(email, password, displayName);
    }
  },

  // Login existing user
  async login(email, password) {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        if (typeof window !== 'undefined' && window.firebase?.auth?.Auth?.Persistence) {
          try {
            await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
          } catch(e) {}
        }
        const cred = await auth.signInWithEmailAndPassword(email, password);
        if (cred && cred.user) {
          localDb.setSession({
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || cred.user.email.split('@')[0]
          });
          return cred.user;
        }
      } catch (firebaseErr) {
        console.warn("Firebase Auth login failed, checking local credentials:", firebaseErr);
        try {
          return await localDb.signIn(email, password);
        } catch (localErr) {
          throw firebaseErr;
        }
      }
    } else {
      return await localDb.signIn(email, password);
    }
  },

  // Logout
  async logout() {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await auth.signOut();
      } catch(e) {}
    }
    await localDb.signOut();
  },

  // Send password reset email
  async resetPassword(email) {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await auth.sendPasswordResetEmail(email);
        return true;
      } catch (e) {
        console.warn("Firebase reset error:", e);
      }
    }
    await new Promise(r => setTimeout(r, 600));
    return true;
  },

  // Get current user synchronously or asynchronously
  getCurrentUser() {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      return auth.currentUser;
    }
    return localDb.getCurrentUser();
  },

  // Observer for auth state changes with persistent cache bridge
  onAuthStateChanged(callback) {
    const auth = getFirebaseAuth();
    if (auth) {
      return auth.onAuthStateChanged(user => {
        if (user) {
          localDb.setSession({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
          });
          callback(user);
        } else {
          // Check cached local session before emitting null
          const cached = localDb.getCurrentUser();
          callback(cached || null);
        }
      });
    } else {
      const user = localDb.getCurrentUser();
      callback(user || null);
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
