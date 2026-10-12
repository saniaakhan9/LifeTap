 
document.addEventListener('DOMContentLoaded', () => {
  // --- Synchronize & Toggle Dark / Light Theme ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  if (document.documentElement.classList.contains('dark-theme')) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-theme');
    const isDark = document.documentElement.classList.contains('dark-theme');

    if (isDark) {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('lifetap_theme', 'dark');
    } else {
      themeIcon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('lifetap_theme', 'light');
    }
  });

  // --- Dynamic User Greeting & Profile Management ---
  const currentUserJson = localStorage.getItem('lifetap_current_user');
  if (currentUserJson) {
    try {
      const user = JSON.parse(currentUserJson);
      if (user && user.name) {
        document.getElementById('welcomeName').textContent = user.name;
        document.getElementById('userNameDisplay').textContent = user.name;
      }
    } catch (e) {
      console.error('Error parsing current user session', e);
    }
  }

  // --- Logout Functionality ---
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('lifetap_current_user');
    window.location.href = 'firstpage.html';
  });

  // --- Copy ID Button Functionality ---
  const copyIdBtn = document.getElementById('copyIdBtn');
  const lifetapIdText = document.getElementById('lifetapIdText');

  copyIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lifetapIdText.textContent).then(() => {
      const originalIcon = copyIdBtn.innerHTML;
      copyIdBtn.innerHTML = '<i class="fa-solid fa-check text-red"></i>';
      setTimeout(() => {
        copyIdBtn.innerHTML = originalIcon;
      }, 2000);
    });
  });

  // --- View QR Code Action ---
  const viewQrBtn = document.getElementById('viewQrBtn');
  viewQrBtn.addEventListener('click', () => {
    alert('LifeTap QR Code is ready for scanning in case of emergency.');
  });
});