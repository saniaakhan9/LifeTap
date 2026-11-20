/**
 * LifeTap: Smart Emergency ID
 * Privacy Controls Service
 * 
 * Enforces field-level access control on what information is published
 * to the publicly accessible emergency token document.
 */

import { getFirestoreDb, localDb } from './firebase-config.js';

export const defaultPrivacySettings = {
  showFullName: true,
  showBloodGroup: true,
  showAllergies: true,
  showConditions: true,
  showMedications: true,
  showContact2: true,
  showInstructions: true,
  showOrganDonor: true
};

export const privacyService = {
  // Get privacy settings for user
  async getSettings(uid) {
    if (!uid) return defaultPrivacySettings;

    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('users').doc(uid).collection('settings').doc('privacy').get();
        if (doc.exists) {
          return { ...defaultPrivacySettings, ...doc.data() };
        }
      } catch (err) {
        console.warn("Could not read privacy settings from Firestore:", err);
      }
    }

    // Local storage fallback
    const key = `lifetap_privacy_${uid}`;
    const saved = localStorage.getItem(key);
    return saved ? { ...defaultPrivacySettings, ...JSON.parse(saved) } : defaultPrivacySettings;
  },

  // Save privacy settings
  async saveSettings(uid, settings) {
    if (!uid) throw new Error("User ID is required to save privacy settings.");

    const merged = { ...defaultPrivacySettings, ...settings };

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('users').doc(uid).collection('settings').doc('privacy').set(merged);
      } catch (err) {
        console.warn("Firestore privacy save failed, storing locally:", err);
      }
    }

    const key = `lifetap_privacy_${uid}`;
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  },

  /**
   * Filter and mask profile data according to privacy toggles
   * This object is what gets published to the public emergency_tokens collection
   */
  filterPublicEmergencyData(profile, privacy) {
    if (!profile) return {};

    const p = privacy || defaultPrivacySettings;

    return {
      fullName: p.showFullName ? (profile.fullName || 'Protected User') : 'Anonymous Individual',
      bloodGroup: p.showBloodGroup ? (profile.bloodGroup || '') : null,
      allergies: p.showAllergies ? (profile.allergies || '') : null,
      conditions: p.showConditions ? (profile.conditions || null) : null,
      medications: p.showMedications ? (profile.medications || null) : null,
      instructions: p.showInstructions ? (profile.instructions || null) : null,
      isOrganDonor: p.showOrganDonor ? !!profile.isOrganDonor : null,
      
      // Emergency Contact 1 is critical for rescue
      emergencyContact1Name: profile.emergencyContact1Name || 'Emergency Contact',
      emergencyContact1Phone: profile.emergencyContact1Phone || '',
      
      // Emergency Contact 2 respects privacy toggle
      emergencyContact2Name: p.showContact2 ? (profile.emergencyContact2Name || '') : '',
      emergencyContact2Phone: p.showContact2 ? (profile.emergencyContact2Phone || '') : '',

      updatedAt: new Date().toISOString()
    };
  }
};
