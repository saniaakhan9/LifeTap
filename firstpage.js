document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Elements & Persistence Logic ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  // Check saved theme state from root HTML class
  if (document.documentElement.classList.contains('dark-theme')) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  // Toggle Dark / Light Theme
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

  // --- Smooth scroll and active state management for navbar links ---
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const headerOffset = 80;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Active link scroll spy ---
  window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // --- Dynamic user session check ---
  const currentUser = localStorage.getItem('lifetap_current_user');
  if (currentUser) {
    const getStartedBtn = document.querySelector('.btn-hero');
    if (getStartedBtn) {
      getStartedBtn.setAttribute('href', 'thirdpage.html');
      getStartedBtn.innerHTML = 'Go to Dashboard <i class="fa-solid fa-arrow-right"></i>';
    }
  }
});