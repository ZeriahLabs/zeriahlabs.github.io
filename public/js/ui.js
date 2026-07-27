<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Dino Guess | Zeriah Labs</title>
  
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  
  <link rel="stylesheet" href="/css/style.css">
  
  <style>
    /* --------------------------------------------------------------------------
       DINO GUESS SPECIFIC STYLES
       -------------------------------------------------------------------------- */
    .dino-guess-board {
      font-family: 'Nunito', sans-serif;
      background: linear-gradient(180deg, #1e293b, #0f172a);
      border-radius: 24px;
      padding: 30px;
      border: 4px solid var(--brand);
      box-shadow: 0 10px 40px rgba(0, 208, 255, 0.2);
      text-align: center;
    }
    .game-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .game-title { margin: 0; font-size: 2rem; font-weight: 900; color: var(--brand2); }
    .score-tracker { background: rgba(255, 255, 255, 0.1); padding: 10px 20px; border-radius: 99px; font-size: 1.2rem; font-weight: 900; color: #fff; }

    /* Dino Image Constraints */
    .dino-image-container { height: 300px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
    .dino-img { max-height: 100%; max-width: 100%; transition: filter 0.2s ease-out, transform 0.3s ease; pointer-events: none; user-select: none; }
    .silhouette { filter: brightness(0) drop-shadow(0 0 10px rgba(0,0,0,0.5)); transform: scale(0.95); }

    /* 3D Button Style */
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .option-btn {
      font-family: 'Nunito', sans-serif;
      font-size: 1.3rem;
      font-weight: 900;
      color: #07101a;
      background: var(--brand);
      border: none;
      border-radius: 16px;
      padding: 15px;
      cursor: pointer;
      box-shadow: 0 8px 0 #0099cc;
      transition: transform 0.1s, box-shadow 0.1s, background-color 0.1s;
    }
    .option-btn:active { transform: translateY(8px); box-shadow: 0 0 0 #0099cc; }
    .option-btn:disabled { cursor: not-allowed; opacity: 0.7; }
    .option-btn.correct { background: var(--brand2); box-shadow: 0 8px 0 #00b300; color: #07101a; }
    .option-btn.wrong { background: #ef4444; box-shadow: 0 8px 0 #cc0000; opacity: 0.5; }
    
    .primary-btn {
      background-color: var(--brand); 
      color: #07101a; 
      border: none;
      padding: 15px 40px;
      font-size: 1.5rem;
      border-radius: 12px;
      font-weight: 900;
      cursor: pointer;
      margin-top: 20px;
      transition: transform 0.1s;
    }
    .primary-btn:active { transform: scale(0.95); }
    .primary-btn:disabled { background-color: var(--rule); cursor: not-allowed; }

    @keyframes popIn {
      0% { transform: scale(0.5); opacity: 0; }
      80% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-pop { animation: popIn 0.4s ease-out forwards; }
  </style>
</head>
<body>

  <header>
      <div class="global-header">
          <a href="/" class="brand-container" style="text-decoration: none; color: var(--ink);">
              <img src="https://assets.zeriahlabs.com/Zeriah_Labs_Vertical_Final.webp" alt="Zeriah Labs logo" style="height:36px; object-fit: contain;">
              <span>Zeriah Labs</span>
          </a>
          
          <div id="auth-container">
              </div>
      </div>
  </header>

  <main class="wrap dashboard-layout">
    <section>
      <a href="../index.html" style="color: var(--brand); text-decoration: none; font-weight: 700;">← Back to Dashboard</a>
      
      <div class="dino-guess-board" style="margin-top: 20px;">
        <div class="game-header">
          <h2 class="game-title">Dino Guess</h2>
          <div class="score-tracker">
            ⏱ <span id="time" style="color: var(--brand2);">60</span>s &nbsp;|&nbsp; ⭐ <span id="score" style="color: var(--brand);">0</span>
          </div>
        </div>

        <div id="start-screen" style="padding: 20px 0;">
          <img src="https://assets.zeriahlabs.com/whosthatdinosaur/dino_guess_logo.webp" alt="Dino Guess Logo" class="animate-pop" style="height: 180px; margin: 0 auto 20px auto; display: block; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5)); transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <h3 style="color: #eef6ff; font-size: 1.5rem; margin-bottom: 30px;">Can you name all of them?</h3>
          <button id="start-btn" class="primary-btn animate-pop" onclick="startGame()" disabled>Loading Dinosaurs...</button>
        </div>

        <div id="game-screen" style="display: none;">
            <h2 id="question-text" style="color: #eef6ff; font-size: 1.8rem; margin-bottom: 15px;">Loading...</h2>
            
            <div class="dino-image-container">
                <img id="dino-display" class="dino-img" src="" alt="Dinosaur" style="display: none;">
            </div>
            
            <div id="attribution-text" style="font-size: 0.75rem; color: var(--muted); margin-bottom: 20px; display: none;"></div>

            <div class="options-grid" id="options">
                </div>
        </div>

        <div id="game-over-screen" style="display: none; padding: 40px 0;">
            <h1 style="color: #fff; font-size: 3rem; margin-bottom: 10px;">Time's Up!</h1>
            <h2 style="color: #eef6ff; margin-bottom: 20px;">You identified <span id="final-score" style="color: var(--brand);">0</span> Dinosaurs!</h2>
            <p style="color: #eef6ff; font-size: 1.2rem; margin-bottom: 30px;">Paleontology Rank: <strong id="rank" style="color: var(--brand2);">Egg</strong></p>
            <button class="primary-btn" onclick="startGame()">Play Again</button>
        </div>
      </div>
    </section>

    <aside>
        <div class="achievements-panel">
            <h2>🏆 Global Progress</h2>
            <div class="user-progress">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--ink);">
                    <span>Zeriah Rank</span>
                    <span id="sidebar-xp-text">Log in to track</span>
                </div>
                <div class="xp-bar"><div id="sidebar-xp-fill" class="xp-fill" style="width: 0%;"></div></div>
            </div>
            
            <div class="achievement-list" id="global-achievement-list">
                <div style="text-align: center; color: var(--muted); padding: 20px; font-size: 0.85rem;">
                    Log in to view your Zeriah Labs arcade achievements!
                </div>
            </div>
            
            <a href="/achievements/" class="btn-outline">View Master Trophy Room</a>
        </div>
    </aside>
  </main>

  <div id="auth-modal" class="modal-overlay" style="display: none;">
      <div class="modal">
          <h2 id="auth-title">Welcome Back</h2>
          <div id="auth-error" style="color: #ef4444; margin-bottom: 12px; font-size: 0.9rem; font-weight: bold; display: none;"></div>
          
          <form id="auth-form" style="width: 100%;" onsubmit="handleAuthSubmit(event)">
              <input type="text" id="auth-name" placeholder="Display Name" class="auth-input" style="display: none;" />
              <input type="email" id="auth-email" placeholder="Email Address" required class="auth-input" />
              <input type="password" id="auth-password" placeholder="Password" required class="auth-input" />
              <button type="submit" id="auth-submit-btn" class="btn-primary" style="width: 100%; margin-top: 10px; font-size: 1.1rem; padding: 12px;">Login</button>
          </form>
          
          <p style="margin-top: 24px; font-size: 0.9rem; color: var(--muted);">
              <span id="auth-toggle-text">Don't have an account?</span> 
              <a href="#" onclick="toggleAuthMode(event)" style="color: var(--brand2); text-decoration: none; font-weight: bold;">Click here</a>
          </p>
          <button onclick="closeAuthModal()" style="margin-top: 10px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem;">Cancel</button>
      </div>
  </div>

  <audio id="sound-correct" src="/sounds/yay.mp3"></audio>
  <audio id="sound-wrong" src="/sounds/wrong.mp3"></audio>
  <audio id="bgm" src="/sounds/bgm.mp3" loop></audio>

  <script src="/js/auth.js"></script>
  <script src="/js/ui.js"></script> 
  <script src="/js/dino-engine.js"></script>
  
  <script>
      // Force the game filter on page load
      document.addEventListener("DOMContentLoaded", () => {
          // If your auth script relies on this keyword, we pass it here.
          // Note: Please share auth.js/ui.js if the filtering doesn't work!
          if (typeof window.checkSession === 'function') {
              window.checkSession("dino");
          }
      });
  </script>

</body>
</html>
