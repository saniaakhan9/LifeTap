/**
 * LifeTap: Smart Emergency ID
 * Public Responder & Emergency View Controller
 */

import { getFirestoreDb, localDb, showToast } from './firebase-config.js';

export const emergencyService = {
  // Fetch emergency token data from Firestore or local fallback
  async fetchEmergencyData(tokenId) {
    if (!tokenId) return null;

    const db = getFirestoreDb();
    if (db) {
      try {
        const doc = await db.collection('emergency_tokens').doc(tokenId).get();
        if (doc.exists) {
          return doc.data();
        }
        return null;
      } catch (err) {
        console.warn("Firestore emergency token lookup failed:", err);
        // If security rules rejected reading because token is inactive/revoked
        if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
          return { active: false, revoked: true };
        }
      }
    }

    return await localDb.getEmergencyToken(tokenId);
  }
};

let mapInstance = null;
let currentIncidentCoords = null;

export function initializeEmergencyResponderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenId = urlParams.get('token');

  const loadingEl = document.getElementById('emergency-loading');
  const contentEl = document.getElementById('emergency-content');
  const errorEl = document.getElementById('emergency-error');
  const errorTitle = document.getElementById('error-title');
  const errorDesc = document.getElementById('error-desc');

  if (!tokenId) {
    showError("No Emergency Token Provided", "Please scan a valid LifeTap QR code to access medical responder data.");
    return;
  }

  emergencyService.fetchEmergencyData(tokenId).then(data => {
    if (loadingEl) loadingEl.style.display = 'none';

    if (!data) {
      showError("Emergency Token Not Found", "The scanned emergency token is invalid or has expired. Please verify the physical ID card.");
      return;
    }

    if (data.active === false || data.revoked) {
      showError("Emergency Profile Suspended", "This emergency ID has been deactivated or revoked by the cardholder. A new QR code has been generated.");
      return;
    }

    // Render valid responder profile
    renderResponderView(data);
  }).catch(err => {
    if (loadingEl) loadingEl.style.display = 'none';
    if (err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission')))) {
      showError("Emergency Profile Suspended", "This emergency ID has been deactivated or revoked by the cardholder.");
    } else {
      showError("Unable to Load Emergency Profile", "A network error occurred while retrieving emergency information.");
    }
  });

  function showError(title, message) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      if (errorTitle) errorTitle.textContent = title;
      if (errorDesc) errorDesc.textContent = message;
    }
  }

  function renderResponderView(data) {
    if (contentEl) contentEl.style.display = 'block';

    // Name & Verification
    const nameEl = document.getElementById('resp-fullName');
    if (nameEl) nameEl.textContent = data.fullName || 'Anonymous Individual';

    // Blood Group
    const bloodValEl = document.getElementById('resp-bloodVal');
    if (bloodValEl) {
      bloodValEl.textContent = data.bloodGroup || 'UNK';
    }

    // Organ Donor Badge
    const organDonorEl = document.getElementById('resp-organDonor');
    if (organDonorEl) {
      organDonorEl.style.display = data.isOrganDonor ? 'inline-flex' : 'none';
    }

    // Critical Allergies
    const allergyBox = document.getElementById('resp-allergy-box');
    const allergyText = document.getElementById('resp-allergies');
    if (data.allergies && data.allergies.trim()) {
      allergyBox.style.display = 'block';
      allergyText.textContent = data.allergies;
    } else {
      allergyBox.style.display = 'none';
    }

    // Medical Conditions
    const conditionsSection = document.getElementById('resp-section-conditions');
    const conditionsText = document.getElementById('resp-conditions');
    if (data.conditions && data.conditions.trim()) {
      conditionsSection.style.display = 'block';
      conditionsText.textContent = data.conditions;
    } else {
      conditionsSection.style.display = 'none';
    }

    // Medications
    const medsSection = document.getElementById('resp-section-meds');
    const medsText = document.getElementById('resp-medications');
    if (data.medications && data.medications.trim()) {
      medsSection.style.display = 'block';
      medsText.textContent = data.medications;
    } else {
      medsSection.style.display = 'none';
    }

    // Emergency Instructions
    const instructionsSection = document.getElementById('resp-section-instructions');
    const instructionsText = document.getElementById('resp-instructions');
    if (data.instructions && data.instructions.trim()) {
      instructionsSection.style.display = 'block';
      instructionsText.textContent = data.instructions;
    } else {
      instructionsSection.style.display = 'none';
    }

    // Primary Call Button
    const callBtn1 = document.getElementById('resp-call-btn-1');
    const callText1 = document.getElementById('resp-call-text-1');
    if (data.emergencyContact1Phone) {
      const cleanPhone = data.emergencyContact1Phone.replace(/[^\d+]/g, '');
      callBtn1.href = `tel:${cleanPhone}`;
      callText1.textContent = `Call ${data.emergencyContact1Name || 'Emergency Contact'} (${data.emergencyContact1Phone})`;
      callBtn1.style.display = 'flex';
    } else {
      callBtn1.style.display = 'none';
    }

    // Secondary Call Button
    const callBtn2 = document.getElementById('resp-call-btn-2');
    const callText2 = document.getElementById('resp-call-text-2');
    if (data.emergencyContact2Phone) {
      const cleanPhone2 = data.emergencyContact2Phone.replace(/[^\d+]/g, '');
      callBtn2.href = `tel:${cleanPhone2}`;
      callText2.textContent = `Call ${data.emergencyContact2Name || 'Backup Contact'} (${data.emergencyContact2Phone})`;
      callBtn2.style.display = 'flex';
    } else {
      callBtn2.style.display = 'none';
    }

    // Setup GPS Location Sharing
    setupLocationDispatch(data);
  }

  function setupLocationDispatch(data) {
    const btnPing = document.getElementById('btn-capture-location');
    const mapEl = document.getElementById('leaflet-map');
    const coordsBadge = document.getElementById('coords-badge');
    const dispatchRow = document.getElementById('dispatch-row');
    const btnWhatsapp = document.getElementById('btn-dispatch-whatsapp');
    const btnSms = document.getElementById('btn-dispatch-sms');

    if (!btnPing) return;

    btnPing.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by this browser.', 'error');
        return;
      }

      btnPing.disabled = true;
      btnPing.innerHTML = `<span>⏳ Acquiring GPS Satellites...</span>`;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);
          currentIncidentCoords = { lat, lng };

          btnPing.innerHTML = `<span>📍 Location Locked (±${accuracy}m)</span>`;
          btnPing.style.background = '#16a34a';

          // Show coordinates
          coordsBadge.style.display = 'block';
          coordsBadge.textContent = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Timestamp: ${new Date().toLocaleTimeString()})`;

          // Render Leaflet Map
          mapEl.style.display = 'block';
          if (!mapInstance && window.L) {
            mapInstance = L.map('leaflet-map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(mapInstance);

            const redIcon = L.divIcon({
              className: 'custom-emergency-pin',
              html: `<div style="background:#dc2626; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px rgba(220,38,38,0.8);"></div>`,
              iconSize: [20, 20]
            });

            L.marker([lat, lng], { icon: redIcon }).addTo(mapInstance)
              .bindPopup(`<strong>Incident Location</strong><br>Reported via LifeTap`)
              .openPopup();
          } else if (mapInstance) {
            mapInstance.setView([lat, lng], 15);
          }

          // Build prefilled alert messages
          const patientName = data.fullName || 'a LifeTap cardholder';
          const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
          const messageText = `EMERGENCY ALERT: I have found ${patientName}'s LifeTap ID. Responders are attending to them. Exact Incident Location: ${mapsUrl}`;

          // Format WhatsApp & SMS links
          const primaryPhone = data.emergencyContact1Phone ? data.emergencyContact1Phone.replace(/[^\d+]/g, '') : '';
          
          dispatchRow.style.display = 'grid';
          btnWhatsapp.href = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(messageText)}`;
          btnSms.href = `sms:${primaryPhone}?body=${encodeURIComponent(messageText)}`;

          showToast('GPS coordinates captured successfully!', 'success');
        },
        (error) => {
          btnPing.disabled = false;
          btnPing.innerHTML = `<span>📍 Share Incident GPS Location</span>`;
          showToast('Unable to capture location: ' + error.message, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }
}
