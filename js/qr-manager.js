/**
 * LifeTap: Smart Emergency ID
 * QR Code & Cryptographic Token Manager
 */

import { getFirestoreDb, localDb, showToast } from './firebase-config.js';
import { privacyService } from './privacy.js';

/**
 * Generate cryptographically secure URL-friendly token (NanoID equivalent)
 */
export function generateSecureToken(size = 18) {
  const alphabet = 'useandom-26T1983_40XYZabcde579gklmnopqrvwxyz';
  let token = '';
  const cryptoObj = window.crypto || window.msCrypto;
  
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(size);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < size; i++) {
      token += alphabet[values[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < size; i++) {
      token += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return token;
}

export const qrManager = {
  // Construct the full public responder URL for a token
  getEmergencyUrl(tokenId) {
    const origin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '';
    // Handle path resolution for GitHub Pages / subfolder or root
    const pathname = window.location.pathname;
    const basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return `${origin}${basePath}emergency.html?token=${encodeURIComponent(tokenId)}`;
  },

  // Get active token record for a user
  async getUserTokenRecord(uid) {
    if (!uid) return null;

    const db = getFirestoreDb();
    if (db) {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data.activeTokenId) {
            const tokenDoc = await db.collection('emergency_tokens').doc(data.activeTokenId).get();
            if (tokenDoc.exists) {
              return tokenDoc.data();
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching token record from Firestore:", err);
      }
    }

    // Local fallback
    const key = `lifetap_user_token_${uid}`;
    const tokenId = localStorage.getItem(key);
    if (tokenId) {
      return await localDb.getEmergencyToken(tokenId);
    }
    return null;
  },

  // Initialize or fetch token for user
  async ensureUserToken(uid, profile, privacySettings) {
    let existing = await this.getUserTokenRecord(uid);
    if (existing) {
      return existing;
    }
    // Generate new token
    return await this.createTokenForUser(uid, profile, privacySettings);
  },

  // Create and register a brand new token
  async createTokenForUser(uid, profile, privacySettings) {
    const tokenId = 'lt_' + generateSecureToken(16);
    const publicData = privacyService.filterPublicEmergencyData(profile, privacySettings);
    
    const record = {
      ...publicData,
      tokenId,
      userId: uid,
      active: true,
      createdAt: new Date().toISOString()
    };

    const db = getFirestoreDb();
    if (db) {
      try {
        // Save to public emergency_tokens registry
        await db.collection('emergency_tokens').doc(tokenId).set(record);
        // Link to user document
        await db.collection('users').doc(uid).set({ activeTokenId: tokenId }, { merge: true });
      } catch (err) {
        console.warn("Firestore token save failed:", err);
      }
    }

    // Save to localDb
    await localDb.saveEmergencyToken(tokenId, record);
    localStorage.setItem(`lifetap_user_token_${uid}`, tokenId);

    return record;
  },

  // Sync latest profile & privacy updates to existing token
  async syncTokenData(uid, tokenId, profile, privacySettings) {
    if (!tokenId) return;

    const publicData = privacyService.filterPublicEmergencyData(profile, privacySettings);

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('emergency_tokens').doc(tokenId).set({
          ...publicData,
          userId: uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not sync Firestore token:", err);
      }
    }

    const current = (await localDb.getEmergencyToken(tokenId)) || {};
    await localDb.saveEmergencyToken(tokenId, {
      ...current,
      ...publicData,
      userId: uid
    });
  },

  // Toggle QR Active / Deactivated status
  async setTokenActive(uid, tokenId, isActive) {
    if (!tokenId) return;

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection('emergency_tokens').doc(tokenId).update({
          active: !!isActive,
          statusChangedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Error updating token status in Firestore:", err);
      }
    }

    await localDb.setTokenActiveStatus(tokenId, isActive);
    return isActive;
  },

  // Revoke current token and generate a fresh one (Invalidates old printed QR codes)
  async regenerateToken(uid, profile, privacySettings, oldTokenId) {
    if (oldTokenId) {
      // Deactivate old token
      await this.setTokenActive(uid, oldTokenId, false);
      const db = getFirestoreDb();
      if (db) {
        try {
          await db.collection('emergency_tokens').doc(oldTokenId).update({
            revoked: true,
            active: false
          });
        } catch (e) {
          console.warn("Error revoking old token:", e);
        }
      }
    }

    return await this.createTokenForUser(uid, profile, privacySettings);
  },

  // Render QR Code into DOM element
  renderQRCode(containerEl, url, size = 180) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (window.QRCode) {
      return new QRCode(containerEl, {
        text: url,
        width: size,
        height: size,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      containerEl.innerHTML = `<p style="color:red; font-size:0.8rem;">QRCode library not loaded</p>`;
    }
  },

  // Download QR Code element as PNG image file
  downloadQRCode(containerEl, fileName = 'LifeTap-Emergency-QR.png') {
    if (!containerEl) return;
    
    // QRCode.js creates either a canvas or an img
    const canvas = containerEl.querySelector('canvas');
    const img = containerEl.querySelector('img');

    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      this.triggerDownload(dataUrl, fileName);
    } else if (img && img.src) {
      this.triggerDownload(img.src, fileName);
    } else {
      showToast('Unable to export QR code image', 'error');
    }
  },

  triggerDownload(dataUrl, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Emergency QR Code downloaded!', 'success');
  }
};
