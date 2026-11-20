/**
 * LifeTap: Smart Emergency ID
 * Theme Management Controller (Dark / Light Theme System)
 */

export function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem('lifetap-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
  } catch (e) {}

  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme) {
  const activeTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = activeTheme === 'dark';

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', activeTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
    }

    try {
      localStorage.setItem('lifetap-theme', activeTheme);
    } catch (e) {}

    updateThemeToggleButtons(activeTheme);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifetap:themechange', { detail: { theme: activeTheme } }));
  }
  return activeTheme;
}

export function toggleTheme() {
  const current = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || getPreferredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
}

export function setupThemeToggleButtons() {
  const current = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || getPreferredTheme();
  updateThemeToggleButtons(current);
}

function updateThemeToggleButtons(theme) {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';

  document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    
    const iconEl = btn.querySelector('.theme-toggle-icon');
    if (iconEl) {
      iconEl.innerHTML = isDark
        ? `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#f59e0b;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`
        : `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#64748b;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    }
  });
}

export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);

  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('lifetap-theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch (err) {}
    });
  }
}

// Global Delegation Listener for 100% reliable clicks anywhere
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.btn-theme-toggle');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      toggleTheme();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupThemeToggleButtons();
    });
  } else {
    setupThemeToggleButtons();
  }
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.LifeTapTheme = {
    get: getPreferredTheme,
    apply: applyTheme,
    toggle: toggleTheme,
    init: initTheme,
    setupButtons: setupThemeToggleButtons
  };
  initTheme();
}
