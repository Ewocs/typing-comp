// Scroll to Top Button Functionality
document.addEventListener('DOMContentLoaded', function () {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const rootElement = document.documentElement;

  if (!scrollToTopBtn) return;

  function handleScroll() {
    const scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;
    if (rootElement.scrollTop / scrollTotal > 0.1) {
      scrollToTopBtn.style.display = 'flex';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  }

  function scrollToTop() {
    rootElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  document.addEventListener('scroll', handleScroll);
  scrollToTopBtn.addEventListener('click', scrollToTop);

  // Initial check
  handleScroll();
});
