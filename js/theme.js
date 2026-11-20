/**
 * LifeTap: Smart Emergency ID
 * Theme Management Controller (Dark / Light Theme System)
 */

export function getPreferredTheme() {
  const storedTheme = localStorage.getItem('lifetap-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme) {
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', activeTheme);
  if (activeTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('lifetap-theme', activeTheme);
  updateThemeToggleButtons(activeTheme);
  window.dispatchEvent(new CustomEvent('lifetap:themechange', { detail: { theme: activeTheme } }));
  return activeTheme;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
}

export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);

  // Listen to OS-level dark mode changes if user hasn't explicitly set a preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('lifetap-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Setup click listeners for all toggle buttons on page
  setupThemeToggleButtons();
}

export function setupThemeToggleButtons() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeToggleButtons(current);

  document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
    // Avoid double attaching
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}

function updateThemeToggleButtons(theme) {
  const isDark = theme === 'dark';
  document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    const iconEl = btn.querySelector('.theme-toggle-icon');
    if (iconEl) {
      iconEl.innerHTML = isDark
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    }
    const textEl = btn.querySelector('.theme-toggle-text');
    if (textEl) {
      textEl.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
  });
}

// Automatically apply theme on script load
if (typeof window !== 'undefined') {
  initTheme();
}
