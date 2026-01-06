const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.classList.add('show');
    }

    function hideError() {
      errorMessage.classList.remove('show');
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showError('Please enter email and password');
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showError(data.error || 'Login failed');
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
          return;
        }

        // Store token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('organizerName', data.organizer.name);
        localStorage.setItem('organizerEmail', data.organizer.email);

        // Redirect to organizer dashboard
        window.location.href = '/organizer';
      } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }

      
    });

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");

  if (!passwordInput || !toggle) return;

  toggle.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    toggle.textContent = isHidden ? "🙈" : "👁️";
  });
});
document.getElementById("forgotPasswordLink").addEventListener("click", function (e) {
  e.preventDefault();

  const msg = document.getElementById("forgotMessage");
  msg.textContent =
    "Forgot password feature coming soon. Please log in using another email for now.";
  msg.classList.add("show");
});

