const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function hideError() {
  errorMessage.classList.remove('show');
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !password) {
    showError('All fields are required');
    return;
  }

  if (password.length < 12) {
    showError('Password must be at least 12 characters');
    return;
  }

  // Check for password complexity
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[@$!%*?&]/.test(password);

  if (!hasLowerCase || !hasUpperCase || !hasNumbers || !hasSpecialChars) {
    showError('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)');
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account...';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Registration failed');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Create Account';
      return;
    }

    // Store token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('organizerName', data.organizer.name);
    localStorage.setItem('organizerEmail', data.organizer.email);

    // Redirect to organizer dashboard
    window.location.href = '/organizer';
  } catch (error) {
    console.error('Registration error:', error);
    showError('Network error. Please try again.');
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Account';
  }
});