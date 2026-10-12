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
  const registerForm = document.getElementById('registerForm');
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const regConfirmPassword = document.getElementById('regConfirmPassword');
  const termsCheckbox = document.getElementById('termsCheckbox');
  
  const togglePassword1 = document.getElementById('togglePassword1');
  const eyeIcon1 = document.getElementById('eyeIcon1');
  const togglePassword2 = document.getElementById('togglePassword2');
  const eyeIcon2 = document.getElementById('eyeIcon2');

  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');

  // Password Visibility Toggles
  togglePassword1.addEventListener('click', () => {
    const isPassword = regPassword.type === 'password';
    regPassword.type = isPassword ? 'text' : 'password';
    eyeIcon1.classList.toggle('fa-eye', !isPassword);
    eyeIcon1.classList.toggle('fa-eye-slash', isPassword);
  });

  togglePassword2.addEventListener('click', () => {
    const isPassword = regConfirmPassword.type === 'password';
    regConfirmPassword.type = isPassword ? 'text' : 'password';
    eyeIcon2.classList.toggle('fa-eye', !isPassword);
    eyeIcon2.classList.toggle('fa-eye-slash', isPassword);
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  // --- Submit Handler with Robust Email Provider Validation ---
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();

    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();
    const confirmPassword = regConfirmPassword.value.trim();

    // 1. Mandatory empty checks
    if (!name || !email || !password || !confirmPassword) {
      showError('Please fill in all registration fields.');
      return;
    }

    // 2. Strict Email Validation (Supports Gmail, Yahoo, Outlook, or any valid provider domain)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.includes('@') || !emailRegex.test(email)) {
      showError('Please enter a valid email address (e.g., user@gmail.com or user@yahoo.com).');
      return;
    }

    // 3. Password minimum 6 characters check
    if (password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    // 4. Password matching check
    if (password !== confirmPassword) {
      showError('Passwords do not match. Please re-enter.');
      return;
    }

    // 5. Terms & Conditions agreement check
    if (!termsCheckbox.checked) {
      showError('You must agree to the Terms & Conditions to register.');
      return;
    }

    // 6. Save user data into localStorage
    const users = JSON.parse(localStorage.getItem('lifetap_users') || '[]');
    
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      showError('An account with this email already exists. Please login instead.');
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem('lifetap_users', JSON.stringify(users));

    // Redirect to login page after successful registration
    window.location.href = 'secondpage.html';
  });
});