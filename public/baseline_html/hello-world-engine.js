/*
  =============================================================================
  AI / GEMINI CONTEXT BLOCK (DO NOT REMOVE)
  =============================================================================
  ROLE: Lead Engineer.
  TASK: Write the specific game logic in this file. 
  
  CRITICAL RULES:
  1. ACHIEVEMENT INTEGRATION: Use the `triggerAchievement(id, xp)` function 
     provided below to ping the Cloudflare Worker D1 database. 
  2. ANTI-SPAM: Always wrap achievements in `!sessionAchievements.has(id)` 
     so the API is only hit once per milestone per session.
  3. UI REFRESH: If an achievement fires, `window.renderAchievements()` is 
     called automatically to refresh the scrollable sidebar.
  =============================================================================
*/

// ==========================================
// ZERIAH LABS CORE: Achievement Engine
// ==========================================
async function triggerAchievement(achievementId, xpReward) {
    const userId = localStorage.getItem('zeriah_token');
    
    // Offline / Local Testing Fallback
    if (!userId || userId === "local_test_token_123") {
        console.log(`[TESTING] Unlocked: [${achievementId}] for ${xpReward}XP`);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        return;
    }

    try {
        const response = await fetch('/api/unlock-achievement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, achievementId, xpReward })
        });
        
        const result = await response.json();
        
        // Zeriah Signature Celebration
        if (result.isLevelUp || result.success) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        // Redraw UI sidebar
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement API failed:", err);
    }
}

// ==========================================
// GAMEPLAY VARIABLES & LOGIC
// ==========================================
let score = 0;
let timeLeft = 60;
let timerInterval;

// Session locks prevent spamming the database API
let sessionAchievements = new Set();

window.startGame = function() {
    // 1. Reset State
    score = 0;
    timeLeft = 60;
    sessionAchievements.clear(); 
    
    // 2. Update UI
    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    
    // 3. Switch Screens
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('game-over-screen').style.display = 'none';

    // 4. Audio
    const bgm = document.getElementById('bgm');
    if(bgm) {
        bgm.volume = 0.3; 
        bgm.play().catch(e => console.log("BGM play failed", e));
    }

    // 5. Start Timer
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    // --> Trigger your custom game loop here
    // loadNextQuestion();
}

function updateTimer() {
    timeLeft--;
    const timeEl = document.getElementById('time');
    if(timeEl) timeEl.innerText = timeLeft;
    
    if (timeLeft <= 0) endGame();
}

// Example Interaction Function (Replace with your actual game logic)
window.handleUserAction = function(isCorrect) {
    if (isCorrect) {
        score++;
        document.getElementById('score').innerText = score;
        const sfx = document.getElementById('sound-correct');
        if(sfx) sfx.play();
        
        // Example Achievement Check
        if (score === 10 && !sessionAchievements.has('game_master')) {
            sessionAchievements.add('game_master');
            triggerAchievement('game_master', 100);
        }
    } else {
        const sfx = document.getElementById('sound-wrong');
        if(sfx) sfx.play();
    }
}

function endGame() {
    clearInterval(timerInterval);
    
    const bgm = document.getElementById('bgm');
    if(bgm) bgm.pause(); 
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'block';
    
    const finalScoreEl = document.getElementById('final-score');
    if(finalScoreEl) finalScoreEl.innerText = score;
}
