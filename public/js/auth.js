// 1. Element Selectors
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSwitch = document.getElementById('auth-switch');
const authSwitchText = document.getElementById('auth-switch-text');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const loginBtn = document.getElementById('login-btn');
const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const forgotLink = document.getElementById('forgot-link');

// UI Elements to update upon login
const xpBarFill = document.querySelector('.xp-fill');
const levelText = document.querySelector('.user-progress span:first-child');
const xpText = document.querySelector('.user-progress span:last-child');

let authMode = 'login'; // Can be 'login', 'register', 'forgot', 'reset'
let resetToken = null;
const API_URL = '/api';

// Show/Hide Password Logic
togglePasswordBtn.addEventListener('click', (e) => {
  e.preventDefault(); 
  const isPassword = passwordInput.getAttribute('type') === 'password';
  passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
  togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
});

// Helper Function to Switch UI Modes
function setAuthMode(mode) {
  authMode = mode;
  authError.style.display = 'none';
  authSuccess.style.display = 'none';

  const q = document.getElementById('sec-question');
  const a = document.getElementById('sec-answer');
  
  if (mode === 'register') {
    q.style.display = 'block'; a.style.display = 'block'; q.required = true; a.required = true;
  } else if (mode === 'forgot') {
    passwordContainer.style.display = 'none';
    a.style.display = 'block'; a.placeholder = 'Answer your security question';
  } else {
    q.style.display = 'none'; a.style.display = 'none';
  }
}

// 3. Modal Toggles
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if(localStorage.getItem('zeriah_token')) {
    localStorage.removeItem('zeriah_token');
    window.location.reload();
    return;
  }
  setAuthMode('login');
  authModal.style.display = 'flex';
});

document.getElementById('close-modal').addEventListener('click', () => {
  authModal.style.display = 'none';
  if(authMode === 'reset') window.location.search = ''; // clear token if canceled
});

authSwitch.addEventListener('click', (e) => {
  e.preventDefault();
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  setAuthMode(authMode === 'login' ? 'forgot' : 'login');
});

// Detect Reset Token in URL on Page Load
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('token')) {
    resetToken = urlParams.get('token');
    setAuthMode('reset');
    authModal.style.display = 'flex';
  }
});

// 4. Handle Form Submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.style.display = 'none';
  authSuccess.style.display = 'none';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const question = document.getElementById('sec-question').value;
  const answer = document.getElementById('sec-answer').value;
  
  let endpoint = '';
  let payload = {};

  if (authMode === 'login') { endpoint = '/login'; payload = { email, password }; }
  if (authMode === 'register') { endpoint = '/register'; payload = { email, password, question, answer }; }
  if (authMode === 'forgot') { endpoint = '/get-question'; payload = { email }; } 
  if (authMode === 'reset') { endpoint = '/reset-password'; payload = { email, answer, newPassword: password }; }

  try {
    const response = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      authError.textContent = data.error || 'An error occurred';
      authError.style.display = 'block';
      return;
    }

    if (authMode === 'login' || authMode === 'register') {
      localStorage.setItem('zeriah_token', data.token);
      authModal.style.display = 'none';
      checkSession(); 
    } else if (authMode === 'forgot') {
       authTitle.textContent = "Answer: " + data.question; 
       setAuthMode('reset');
    } else if (authMode === 'reset') {
      authSuccess.textContent = 'Password reset successful! Redirecting...';
      authSuccess.style.display = 'block';
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
    
  } catch (err) {
    authError.textContent = 'Server is currently offline.';
    authError.style.display = 'block';
  }
});

// 5. Verify Session on Page Load
async function checkSession() {
    const token = localStorage.getItem('zeriah_token');
    if (!token) return;

    try {
        const response = await fetch('/api/progress', {
            headers: { 'X-User-Id': token }
        });

        if (response.ok) {
            const data = await response.json();
            
            // 1. Update the Navigation Bar
            updateNavToLoggedIn(data.email);

            // 2. Update the Sidebar Stats (Notice we use 'data' instead of 'user')
            if (levelText) levelText.textContent = data.level;
            if (xpText) xpText.textContent = `${data.xp} / 1000 XP`;
            
            if (xpBarFill) {
                const percentage = Math.min((data.xp / 1000) * 100, 100);
                xpBarFill.style.width = `${percentage}%`;
            }
        } else {
            localStorage.removeItem('zeriah_token');
            window.location.reload();
        }
    } catch (err) {
        console.error("Session check failed", err);
    }
}
// --- NEW: UI Update Logic ---
function updateNavToLoggedIn(email) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        // Extract the name from the email (e.g. "timothy" from "timothy@email.com")
        const name = email.split('@')[0];
        
        // Remove the glowing primary class so it blends in better
        loginBtn.classList.remove('primary');
        loginBtn.style.background = 'rgba(255,255,255,0.05)';
        loginBtn.style.color = 'var(--ink)';
        loginBtn.style.border = '1px solid var(--rule)';
        
        // Change the text to show a user icon, their name, and a logout button
        loginBtn.innerHTML = `👤 ${name} <span id="logout-btn" style="color: #ef4444; margin-left: 12px; font-weight: 900; cursor: pointer;">[Logout]</span>`;
        
        // Remove the click event that opens the login modal
        loginBtn.onclick = null;
        
        // Attach the logout logic
        setTimeout(() => {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    localStorage.removeItem('zeriah_token');
                    window.location.reload(); // Refresh the page to clear states
                });
            }
        }, 100); // Tiny delay to ensure the DOM has updated
    }
}
checkSession();
