/**
 * LifeTap: Smart Emergency ID
 * Printable Emergency ID Card Generator
 */

import { qrManager } from './qr-manager.js';

export const cardGenerator = {
  // Render wallet-sized printable emergency card
  renderCard(containerId, profile, emergencyUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const name = profile?.fullName || 'EMERGENCY PROFILE HOLDER';
    const bloodGroup = profile?.bloodGroup || 'UNKNOWN';
    const contactName = profile?.emergencyContact1Name || 'Emergency Contact';
    const contactPhone = profile?.emergencyContact1Phone || 'Not specified';
    const allergies = profile?.allergies ? (profile.allergies.length > 30 ? profile.allergies.substring(0, 30) + '...' : profile.allergies) : 'None reported';

    container.innerHTML = `
      <div class="wallet-card-preview" id="wallet-card-element">
        <div class="wallet-card-header">
          <strong>LIFETAP</strong>
          <span style="font-size:0.75rem; font-weight:700; letter-spacing:0.04em;">EMERGENCY INFORMATION</span>
        </div>

        <div class="wallet-card-body">
          <div class="card-info-left">
            <div class="card-info-item">
              <div class="card-info-label">Full Name</div>
              <div class="card-info-val" style="font-size:1.05rem;">${escapeHtml(name)}</div>
            </div>

            <div style="display:flex; gap:1rem; margin-bottom:0.5rem;">
              <div class="card-info-item">
                <div class="card-info-label">Blood Group</div>
                <div class="card-info-val" style="color:#dc2626; font-size:1.15rem; font-weight:800;">${escapeHtml(bloodGroup)}</div>
              </div>
              <div class="card-info-item">
                <div class="card-info-label">Allergies</div>
                <div class="card-info-val" style="font-size:0.8rem; color:#b91c1c;">${escapeHtml(allergies)}</div>
              </div>
            </div>

            <div class="card-info-item" style="margin-bottom:0;">
              <div class="card-info-label">Primary Emergency Contact</div>
              <div class="card-info-val" style="font-size:0.875rem;">
                ${escapeHtml(contactName)}: <strong>${escapeHtml(contactPhone)}</strong>
              </div>
            </div>
          </div>

          <div class="card-qr-box">
            <div id="card-qr-canvas-holder"></div>
          </div>
        </div>

        <div class="wallet-card-footer">
          SCAN IF I CANNOT RESPOND • NO APP REQUIRED
        </div>
      </div>
    `;

    // Render high-res QR code inside the card
    setTimeout(() => {
      const qrBox = document.getElementById('card-qr-canvas-holder');
      if (qrBox && emergencyUrl) {
        qrManager.renderQRCode(qrBox, emergencyUrl, 105);
      }
    }, 50);
  },

  // Trigger browser print dialog formatted by print-card.css
  triggerPrint() {
    window.print();
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
