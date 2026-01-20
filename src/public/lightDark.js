const themeBtn = document.getElementById('themeToggle');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const currentTheme =
      document.documentElement.getAttribute('data-color-scheme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-color-scheme', 'light');
      themeBtn.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-color-scheme', 'dark');
      themeBtn.textContent = '☀️';
    }
  });
}
