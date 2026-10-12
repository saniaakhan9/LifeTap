document.addEventListener('DOMContentLoaded', () => {
  // --- Synchronize & Toggle Dark / Light Theme ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  // Check initial state from root HTML class
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

  // --- Form Elements & Logic ---
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const togglePassword = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');

  // Eye Icon Password Visibility Toggle
  togglePassword.addEventListener('click', () => {
    const isPassword = loginPassword.type === 'password';
    loginPassword.type = isPassword ? 'text' : 'password';
    
    eyeIcon.classList.toggle('fa-eye', !isPassword);
    eyeIcon.classList.toggle('fa-eye-slash', isPassword);
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  // --- Submit Handler with Strict Email Validation (@ required) ---
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    // 1. Mandatory empty check
    if (!email || !password) {
      showError('Please fill in both your email address and password.');
      return;
    }

    // 2. Strict email domain validation (checks for username, '@', domain name, and a valid extension like .com, .net, etc.)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email.includes('@') || !emailRegex.test(email)) {
      showError('Invalid email format! Please provide a valid email domain (e.g., user@gmail.com, user@yahoo.com, user@outlook.com).');
      return;
    }

    // 3. Match user against registered users in localStorage
    const users = JSON.parse(localStorage.getItem('lifetap_users') || '[]');
    const matchingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matchingUser) {
      showError('No account found with this email. Please register first.');
      return;
    }

    if (matchingUser.password !== password) {
      showError('Incorrect password. Please try again.');
      return;
    }

    // 4. Save session and navigate to Dashboard page
    localStorage.setItem('lifetap_current_user', JSON.stringify(matchingUser));
    window.location.href = 'dashboard.html';
  });
});