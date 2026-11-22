/**
 * LifeTap: Smart Emergency ID
 * User Profile Management Service
 */

import { getFirestoreDb, localDb, showToast } from './firebase-config.js';

export const profileService = {
  // Get emergency profile for a user
  async getProfile(uid) {
    if (!uid) return null;

    // 1. Check local cache first for instant retrieval
    let localData = null;
    try {
      const raw = localStorage.getItem(`lifetap_profile_${uid}`);
      if (raw) localData = JSON.parse(raw);
    } catch (e) {}
    if (!localData) {
      localData = await localDb.getUserProfile(uid);
    }

    // 2. Fetch from Firestore if available
    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const remote = doc.data() || {};
          let merged = { ...remote };

          // Smart merge: if localData has filled values, don't let empty remote fields overwrite them
          if (localData && typeof localData === 'object') {
            if (localData.updatedAt && remote.updatedAt) {
              if (new Date(localData.updatedAt) > new Date(remote.updatedAt)) {
                merged = { ...remote, ...localData };
              } else {
                merged = { ...localData, ...remote };
              }
            } else {
              // Merge preserving non-empty values from both
              merged = { ...localData };
              Object.keys(remote).forEach(key => {
                if (remote[key] !== undefined && remote[key] !== null && remote[key] !== '') {
                  merged[key] = remote[key];
                }
              });
            }
          }

          try {
            localStorage.setItem(`lifetap_profile_${uid}`, JSON.stringify(merged));
            await localDb.saveUserProfile(uid, merged);
          } catch(e) {}
          return merged;
        }
      } catch (err) {
        console.warn("Could not read Firestore profile, using local:", err);
      }
    }
    return localData;
  },

  // Save emergency profile for a user
  async saveProfile(uid, profileData) {
    if (!uid) throw new Error("User ID is required to save profile.");

    const now = new Date().toISOString();
    const sanitized = {
      fullName: (profileData.fullName || '').trim(),
      bloodGroup: (profileData.bloodGroup || '').trim(),
      allergies: (profileData.allergies || '').trim(),
      conditions: (profileData.conditions || '').trim(),
      medications: (profileData.medications || '').trim(),
      emergencyContact1Name: (profileData.emergencyContact1Name || '').trim(),
      emergencyContact1Phone: (profileData.emergencyContact1Phone || '').trim(),
      emergencyContact2Name: (profileData.emergencyContact2Name || '').trim(),
      emergencyContact2Phone: (profileData.emergencyContact2Phone || '').trim(),
      instructions: (profileData.instructions || '').trim(),
      isOrganDonor: !!profileData.isOrganDonor,
      updatedAt: now
    };

    // 1. ALWAYS persist locally immediately so data is NEVER lost
    try {
      localStorage.setItem(`lifetap_profile_${uid}`, JSON.stringify(sanitized));
      await localDb.saveUserProfile(uid, sanitized);
    } catch (e) {
      console.warn("Local storage write error:", e);
    }

    // 2. Persist to live Firestore
    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('users').doc(uid).set(sanitized, { merge: true });
        console.log("Profile successfully saved to Firestore for UID:", uid);
      } catch (err) {
        console.warn("Firestore save failed, fallback already in local storage:", err);
      }
    }

    return sanitized;
  },

  // Calculate profile completeness score (0 to 100%)
  calculateCompleteness(profile) {
    if (!profile) return 0;
    const requiredKeys = [
      'fullName',
      'bloodGroup',
      'allergies',
      'emergencyContact1Name',
      'emergencyContact1Phone',
      'instructions'
    ];
    let filled = 0;
    requiredKeys.forEach(k => {
      if (profile[k] && profile[k].trim && profile[k].trim().length > 0) {
        filled++;
      }
    });

    // Optional bonus fields
    if (profile.conditions && profile.conditions.trim().length > 0) filled += 0.5;
    if (profile.medications && profile.medications.trim().length > 0) filled += 0.5;

    const percent = Math.min(100, Math.round((filled / (requiredKeys.length + 1)) * 100));
    return percent;
  }
};
