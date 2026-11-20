/**
 * LifeTap: Smart Emergency ID
 * Firebase Configuration & Storage Provider
 * 
 * Instructions:
 * Replace the placeholder values in `firebaseConfig` with your actual Firebase Project keys
 * from Firebase Console (Project Settings > General > Your apps > Web app).
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDL6mqHP7cvJBvl6nI2fp4XwkEY7jlZIGI",
  authDomain: "lifetap-emergency.firebaseapp.com",
  projectId: "lifetap-emergency",
  storageBucket: "lifetap-emergency.firebasestorage.app",
  messagingSenderId: "944413154131",
  appId: "1:944413154131:web:03ca47732c1a195d605fa6",
  measurementId: "G-EEP7JVGG4S"
};

// Check for user-saved runtime config in localStorage, or use default
export function getActiveFirebaseConfig() {
  const saved = (typeof localStorage !== 'undefined') ? localStorage.getItem('lifetap_custom_firebase_config') : null;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.apiKey !== "YOUR_FIREBASE_API_KEY") {
        return parsed;
      }
    } catch (e) {
      console.warn("Invalid saved custom Firebase configuration:", e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export const firebaseConfig = getActiveFirebaseConfig();

// Helper to determine if production Firebase is properly configured
export const isLiveFirebaseConfigured = () => {
  const cfg = getActiveFirebaseConfig();
  return (
    !!cfg.apiKey &&
    cfg.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    cfg.projectId !== "your-lifetap-project"
  );
};

let firebaseApp = null;
let authInstance = null;
let dbInstance = null;

/**
 * Centralized Firebase Initializer
 * Guarantees initializeApp() is executed once across all modules,
 * even when accessed independently by unauthenticated rescuers on emergency.html.
 */
export function initFirebase() {
  if (isLiveFirebaseConfigured() && typeof window !== 'undefined' && window.firebase) {
    const config = getActiveFirebaseConfig();
    if (!firebaseApp) {
      try {
        if (!window.firebase.apps || !window.firebase.apps.length) {
          firebaseApp = window.firebase.initializeApp(config);
        } else {
          firebaseApp = window.firebase.app();
        }
      } catch (err) {
        console.error("Firebase initializeApp error:", err);
      }
    }
    if (firebaseApp) {
      if (!authInstance && window.firebase.auth) {
        try {
          authInstance = window.firebase.auth();
        } catch (e) {
          console.error("Firebase auth() initialization error:", e);
        }
      }
      if (!dbInstance && window.firebase.firestore) {
        try {
          dbInstance = window.firebase.firestore();
        } catch (e) {
          console.error("Firebase firestore() initialization error:", e);
        }
      }
    }
  }
  return { firebaseApp, authInstance, dbInstance };
}

export function getFirebaseAuth() {
  if (!authInstance) {
    initFirebase();
  }
  return authInstance;
}

export function getFirestoreDb() {
  if (!dbInstance) {
    initFirebase();
  }
  return dbInstance;
}

// Early initialization if SDK scripts are already loaded
if (typeof window !== 'undefined') {
  initFirebase();
}

// Storage keys for local fallback mode
const STORAGE_USERS_KEY = 'lifetap_users_db';
const STORAGE_TOKENS_KEY = 'lifetap_tokens_db';
const STORAGE_SESSION_KEY = 'lifetap_current_session';

/**
 * Local Fallback Database & Auth Engine
 * Mirrors Firebase Auth and Firestore API contract when live keys are not yet provided.
 */
class LocalMockDatabase {
  constructor() {
    this.initDemoData();
  }

  initDemoData() {
    let users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
    const demoEmail = "demo@lifetap.com";
    const demoUid = "demo_user_1";
    if (!users[demoUid]) {
      users[demoUid] = {
        uid: demoUid,
        email: demoEmail,
        displayName: "Alex Morgan",
        passwordHash: btoa("password123"),
        createdAt: new Date().toISOString(),
        profile: {
          fullName: "Alex Morgan",
          bloodGroup: "O+",
          allergies: "Penicillin, Peanuts (Carries EpiPen)",
          conditions: "Type 1 Diabetes, Asthma",
          medications: "Insulin glargine, Albuterol inhaler",
          emergencyContact1Name: "Sarah Morgan (Spouse)",
          emergencyContact1Phone: "+1 (555) 234-5678",
          emergencyContact2Name: "Dr. Robert Chen (Physician)",
          emergencyContact2Phone: "+1 (555) 876-5432",
          instructions: "In case of unconsciousness, administer glucagon or call 911 immediately. Inhaler is in left jacket pocket.",
          isOrganDonor: true,
          updatedAt: new Date().toISOString()
        }
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(`lifetap_user_token_${demoUid}`, "demo-emergency-token-99");
    }
    if (!localStorage.getItem(STORAGE_TOKENS_KEY)) {
      // Seed a sample emergency token for immediate testing/demo
      const demoToken = "demo-emergency-token-99";
      const sampleTokens = {
        [demoToken]: {
          tokenId: demoToken,
          userId: "demo_user_1",
          active: true,
          fullName: "Alex Morgan",
          bloodGroup: "O+",
          allergies: "Penicillin, Peanuts (Carries EpiPen)",
          conditions: "Type 1 Diabetes, Asthma",
          medications: "Insulin glargine, Albuterol inhaler",
          emergencyContact1Name: "Sarah Morgan (Spouse)",
          emergencyContact1Phone: "+1 (555) 234-5678",
          emergencyContact2Name: "Dr. Robert Chen (Physician)",
          emergencyContact2Phone: "+1 (555) 876-5432",
          instructions: "In case of unconsciousness, administer glucagon or call 911 immediately. Inhaler is in left jacket pocket.",
          isOrganDonor: true,
          updatedAt: new Date().toISOString()
        }
      };
      localStorage.setItem(STORAGE_TOKENS_KEY, JSON.stringify(sampleTokens));
    }
  }

  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
  }

  saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  getTokens() {
    return JSON.parse(localStorage.getItem(STORAGE_TOKENS_KEY) || '{}');
  }

  saveTokens(tokens) {
    localStorage.setItem(STORAGE_TOKENS_KEY, JSON.stringify(tokens));
  }

  // Auth Operations
  async signUp(email, password, displayName = '') {
    const users = this.getUsers();
    const existing = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }
    const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
    const user = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    users[uid] = { ...user, passwordHash: btoa(password) };
    this.saveUsers(users);
    this.setSession(user);
    return user;
  }

  async signIn(email, password) {
    const users = this.getUsers();
    const userEntry = Object.values(users).find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === btoa(password)
    );
    if (!userEntry) {
      throw new Error("Invalid email or password.");
    }
    const { passwordHash, ...user } = userEntry;
    this.setSession(user);
    return user;
  }

  async signOut() {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  getCurrentUser() {
    const session = localStorage.getItem(STORAGE_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  setSession(user) {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
  }

  // Firestore Profile Operations
  async getUserProfile(uid) {
    const users = this.getUsers();
    const user = users[uid];
    return user?.profile || null;
  }

  async saveUserProfile(uid, profileData) {
    const users = this.getUsers();
    if (!users[uid]) {
      users[uid] = { uid, profile: {} };
    }
    users[uid].profile = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    this.saveUsers(users);
    return users[uid].profile;
  }

  // Token Operations
  async getEmergencyToken(tokenId) {
    const tokens = this.getTokens();
    return tokens[tokenId] || null;
  }

  async saveEmergencyToken(tokenId, publicData) {
    const tokens = this.getTokens();
    tokens[tokenId] = {
      ...publicData,
      tokenId,
      updatedAt: new Date().toISOString()
    };
    this.saveTokens(tokens);
    return tokens[tokenId];
  }

  async revokeEmergencyToken(tokenId) {
    const tokens = this.getTokens();
    if (tokens[tokenId]) {
      tokens[tokenId].active = false;
      this.saveTokens(tokens);
    }
  }

  async setTokenActiveStatus(tokenId, active) {
    const tokens = this.getTokens();
    if (tokens[tokenId]) {
      tokens[tokenId].active = !!active;
      this.saveTokens(tokens);
      return tokens[tokenId];
    }
    return null;
  }
}

// Instance of local mock store
export const localDb = new LocalMockDatabase();

/**
 * Toast Notification Utility
 */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '🔔';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Render standard Firebase status banner to guide the user
 */
export function renderFirebaseBanner() {
  const isLive = isLiveFirebaseConfigured();
  const existing = document.getElementById('lifetap-firebase-status-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'lifetap-firebase-status-banner';
  banner.style.cssText = `
    background: ${isLive ? '#f0fdf4' : '#fffbeb'};
    border-bottom: 1px solid ${isLive ? '#bbf7d0' : '#fde68a'};
    color: ${isLive ? '#166534' : '#92400e'};
    font-size: 0.825rem;
    padding: 0.5rem 1rem;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-weight: 500;
    z-index: 99;
  `;

  if (isLive) {
    banner.innerHTML = `
      <span>🟢 <strong>Firebase Live Connected</strong>: Using project <code>${firebaseConfig.projectId}</code></span>
    `;
  } else {
    banner.innerHTML = `
      <span>⚡ <strong>LifeTap Sandbox Mode Active</strong>: Local storage simulation enabled.</span>
      <button id="btn-open-firebase-modal" style="background:#f59e0b; color:#fff; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:700;">Connect Firebase</button>
    `;
  }

  document.body.insertBefore(banner, document.body.firstChild);

  const btn = document.getElementById('btn-open-firebase-modal');
  if (btn) {
    btn.addEventListener('click', showFirebaseSetupModal);
  }
}

/**
 * Interactive Modal for pasting Firebase credentials without touching code
 */
export function showFirebaseSetupModal() {
  let modal = document.getElementById('firebase-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'firebase-setup-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1rem;
    `;
    
    modal.innerHTML = `
      <div style="background:#fff; border-radius:16px; max-width:540px; width:100%; padding:2rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3 style="font-size:1.25rem; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:0.5rem;">
            🔥 Connect Firebase
          </h3>
          <button id="btn-close-fb-modal" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
        </div>
        <p style="font-size:0.875rem; color:#475569; margin-bottom:1rem; line-height:1.5;">
          Paste your Firebase web app configuration JSON below. You can find this in <strong>Firebase Console > Project Settings > General > Your apps</strong>.
        </p>
        <textarea id="fb-config-input" rows="8" style="width:100%; font-family:monospace; font-size:0.825rem; padding:0.75rem; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:1rem;" placeholder='{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-app.firebaseapp.com",\n  "projectId": "my-app",\n  "storageBucket": "my-app.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123456789:web:abcdef"\n}'></textarea>
        <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
          <button id="btn-clear-fb" class="btn btn-secondary btn-sm">Reset to Sandbox</button>
          <button id="btn-save-fb" class="btn btn-primary btn-sm">Save & Connect</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-fb-modal').onclick = () => modal.remove();
    document.getElementById('btn-clear-fb').onclick = () => {
      localStorage.removeItem('lifetap_custom_firebase_config');
      showToast('Reset to local sandbox mode', 'info');
      modal.remove();
      setTimeout(() => window.location.reload(), 600);
    };
    document.getElementById('btn-save-fb').onclick = () => {
      const val = document.getElementById('fb-config-input').value.trim();
      try {
        let parsed = JSON.parse(val);
        if (!parsed.apiKey || !parsed.projectId) {
          throw new Error("Missing apiKey or projectId in configuration.");
        }
        localStorage.setItem('lifetap_custom_firebase_config', JSON.stringify(parsed));
        showToast('Firebase configuration saved successfully!', 'success');
        modal.remove();
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        alert("Invalid JSON format. Please paste a valid Firebase configuration object.");
      }
    };
  }
}


