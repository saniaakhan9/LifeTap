# LifeTap — Smart Emergency ID

> **Your Voice When You Cannot Speak.**  
> A secure, tokenized, QR-based medical emergency identification web application built with HTML5, CSS3, modern Vanilla JavaScript (ES6+), Firebase Auth, Firestore, Leaflet.js, and OpenStreetMap.

---

## 🌟 Key Features

1. **Zero App Barrier for First Responders**
   - Rescuers scan the QR code using any smartphone camera (iPhone or Android).
   - Opens directly in the mobile browser without app downloads or login screens.

2. **One-Tap Emergency Direct Dial**
   - Direct `tel:` links to primary and secondary emergency contacts with a single tap.

3. **GPS Incident Location & Leaflet.js Pin**
   - Rescuers can capture their live coordinates via the HTML5 Geolocation API.
   - Interactive Leaflet.js map with OpenStreetMap tiles displays the incident scene.
   - Generates pre-filled **WhatsApp and SMS dispatch links** with Google Maps coordinates.

4. **Tokenized Privacy Architecture**
   - Raw medical records are **never** stored inside the QR code image or URL parameters.
   - The QR code contains an unpredictable NanoID token (`lt_...`).
   - Cardholders control exactly which fields (name, blood group, allergies, medications, instructions) are publicly exposed.

5. **Instant QR Revocation & Regeneration**
   - If a helmet sticker or wallet card is lost, users can revoke and regenerate their token in one click, immediately invalidating old codes.

6. **Print-Ready Wallet ID Card**
   - Standard ISO CR80 wallet card layout formatted with `@media print` CSS for cardstock or plastic lamination.
   - Features: `LIFETAP`, `EMERGENCY INFORMATION`, `QR CODE`, `SCAN IF I CANNOT RESPOND`, `NO APP REQUIRED`.

7. **Sandbox Mode with Instant Testing**
   - Works immediately out of the box with built-in LocalStorage simulation and pre-seeded sample emergency token (`demo-emergency-token-99`).
   - Seamlessly connects to live Firebase Firestore whenever credentials are provided.

---

## 📂 Project Architecture

```
lifetap/
├── index.html               # Public Landing page (Hero, features, scanner demo)
├── auth.html                # Authentication page (Register, Login, Password Reset)
├── dashboard.html           # Authenticated User Dashboard (Profile, Privacy, QR Manager, Card)
├── emergency.html           # Public Rescuer/Emergency View (Token-based, No login needed)
├── css/
│   ├── main.css             # Design system, typography, colors, global utility classes
│   ├── landing.css          # Landing page styles & responsive animations
│   ├── auth.css             # Clean card-based auth form styling
│   ├── dashboard.css        # Dashboard sidebar/tabs, profile form, privacy switches
│   ├── emergency.css        # High-contrast emergency UI, medical badges, action bar
│   └── print-card.css       # Print stylesheet for physical Emergency ID Wallet Card
├── js/
│   ├── firebase-config.js   # Firebase SDK init & config + graceful LocalStorage fallback mode
│   ├── auth.js              # Registration, login, logout, auth state observers, password reset
│   ├── profile.js           # Profile data CRUD, validation, completion calculation
│   ├── privacy.js           # Public visibility field controls & masking logic
│   ├── qr-manager.js        # NanoID token generation, QRCode.js rendering, token revocation
│   ├── emergency.js         # Public responder view, Geolocation API, Leaflet.js map, WhatsApp/SMS links
│   └── card-generator.js    # Print-ready wallet card renderer & print trigger
├── assets/
│   └── logo.svg             # LifeTap brand SVG icon
├── firestore.rules          # Production Firestore Security Rules
└── README.md                # Project documentation & setup instructions
```

---

## 🚀 Quick Start / Local Testing

1. **Serve Locally**:
   Run any static local web server inside `d:\lifetap`:
   ```bash
   npx -y serve .
   # OR with Python:
   python -m http.server 8080
   ```
2. **Open the App**:
   Navigate to `http://localhost:8080` (or the port displayed in your terminal).

3. **Test the Responder Scanner View Immediately**:
   - Click **"⚡ Live Scanner Demo"** in the top navigation or go directly to:
     `http://localhost:8080/emergency.html?token=demo-emergency-token-99`
   - Test the one-tap emergency call and the **"Share Incident GPS Location"** feature with interactive Leaflet.js map!

4. **Test the Member Dashboard**:
   - Go to `http://localhost:8080/auth.html?mode=register` to create a profile.
   - Fill in your medical details and emergency contacts.
   - Switch between **Profile**, **Privacy Controls**, **QR Code Center**, and **Printable ID Card**.

---

## 🔥 Firebase Setup Guide

Follow these 4 simple steps to connect your own live Firebase project:

### Step 1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `lifetap-emergency` (or your choice).
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2: Enable Firebase Authentication
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password** and click Save.

### Step 3: Create Cloud Firestore Database
1. In the sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose your database location and start in **Production mode**.
4. Click on the **Rules** tab, paste the contents of `firestore.rules`, and click **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         match /settings/{settingDoc} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
       match /emergency_tokens/{tokenId} {
         allow read: if (resource.data.active == true && (!('revoked' in resource.data) || resource.data.revoked == false))
                     || (request.auth != null && resource.data.userId == request.auth.uid);
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
         allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == resource.data.userId;
         allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### Step 4: Add Web App Configuration
1. In Firebase Console, go to **Project Settings** (gear icon) > **General**.
2. Under **Your apps**, click the Web icon (`</>`).
3. Register app name: `lifetap-web`.
4. Copy the `firebaseConfig` object and either:
   - **Method A (No code editing)**: In the LifeTap web app, click the yellow **"Connect Firebase"** button in the top banner and paste the JSON config object!
   - **Method B (Code editing)**: Paste your keys directly into [js/firebase-config.js](file:///d:/lifetap/js/firebase-config.js).

---

## 🌐 Netlify Deployment Guide

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LifeTap Smart Emergency ID"
   git branch -M main
   git remote add origin https://github.com/your-username/lifetap.git
   git push -u origin main
   ```
2. Log into [Netlify](https://app.netlify.com/).
3. Click **Add new site > Import an existing project > GitHub**.
4. Select your `lifetap` repository.
5. Build settings:
   - **Build command**: *(leave blank — this is a pure static web app)*
   - **Publish directory**: `.` (or root)
6. Click **Deploy Site**. Your live URL will be active in seconds!

---

## 📄 License
MIT License. Created for life-saving emergency response.
