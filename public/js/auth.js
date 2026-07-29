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
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
  });
}

// Helper Function to Switch UI Modes
function setAuthMode(mode) {
  authMode = mode;
  if (authError) authError.style.display = 'none';
  if (authSuccess) authSuccess.style.display = 'none';

  const q = document.getElementById('sec-question');
  const a = document.getElementById('sec-answer');
  
  if (mode === 'register') {
    if (q) { q.style.display = 'block'; q.required = true; }
    if (a) { a.style.display = 'block'; a.required = true; }
  } else if (mode === 'forgot') {
    if (passwordContainer) passwordContainer.style.display = 'none';
    if (a) { a.style.display = 'block'; a.placeholder = 'Answer your security question'; }
  } else {
    if (q) q.style.display = 'none'; 
    if (a) a.style.display = 'none';
  }
}

// 3. Modal Toggles
if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if(localStorage.getItem('zeriah_token')) {
      localStorage.removeItem('zeriah_token');
      window.location.reload();
      return;
    }
    setAuthMode('login');
    if (authModal) authModal.style.display = 'flex';
  });
}

const closeModalBtn = document.getElementById('close-modal');
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    if (authModal) authModal.style.display = 'none';
    if(authMode === 'reset') window.location.search = ''; // clear token if canceled
  });
}

if (authSwitch) {
  authSwitch.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  });
}

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthMode(authMode === 'login' ? 'forgot' : 'login');
  });
}

// Detect Reset Token in URL on Page Load
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('token')) {
    resetToken = urlParams.get('token');
    setAuthMode('reset');
    if (authModal) authModal.style.display = 'flex';
  }
});

// 4. Handle Form Submission
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authError) authError.style.display = 'none';
    if (authSuccess) authSuccess.style.display = 'none';

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
        if (authError) {
          authError.textContent = data.error || 'An error occurred';
          authError.style.display = 'block';
        }
        return;
      }

      if (authMode === 'login' || authMode === 'register') {
        localStorage.setItem('zeriah_token', data.token);
        if (authModal) authModal.style.display = 'none';
        checkSession(); 
      } else if (authMode === 'forgot') {
         if (authTitle) authTitle.textContent = "Answer: " + data.question; 
         setAuthMode('reset');
      } else if (authMode === 'reset') {
        if (authSuccess) {
          authSuccess.textContent = 'Password reset successful! Redirecting...';
          authSuccess.style.display = 'block';
        }
        setTimeout(() => { window.location.href = '/'; }, 2000);
      }
      
    } catch (err) {
      if (authError) {
        authError.textContent = 'Server is currently offline.';
        authError.style.display = 'block';
      }
    }
  });
}

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

            // 2. Update the Sidebar Stats
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
        const name = email.split('@')[0];
        
        loginBtn.classList.remove('primary');
        loginBtn.style.background = 'rgba(255,255,255,0.05)';
        loginBtn.style.color = 'var(--ink)';
        loginBtn.style.border = '1px solid var(--rule)';
        
        loginBtn.innerHTML = `👤 ${name} <span id="logout-btn" style="color: #ef4444; margin-left: 12px; font-weight: 900; cursor: pointer;">[Logout]</span>`;
        
        loginBtn.onclick = null;
        
        setTimeout(() => {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    localStorage.removeItem('zeriah_token');
                    window.location.reload(); 
                });
            }
        }, 100); 
    }
}

checkSession();
