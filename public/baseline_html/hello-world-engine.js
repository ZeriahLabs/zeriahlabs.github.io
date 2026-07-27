// ==========================================
// ZERIAH LABS CORE: Achievement Engine
// ==========================================
async function triggerAchievement(achievementId, xpReward) {
    const userId = localStorage.getItem('zeriah_token');
    if (!userId) {
        console.log(`Offline: Would have unlocked [${achievementId}] for ${xpReward}XP`);
        return;
    }

    try {
        const response = await fetch('/api/unlock-achievement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, achievementId, xpReward })
        });
        
        const result = await response.json();
        if (result.isLevelUp) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement failed", err);
    }
}

// ==========================================
// HELLO WORLD: Game Logic
// ==========================================
let score = 0;
let timeLeft = 60;
let timerInterval;

// Track achievements locally per session to prevent API spam
let sessionAchievements = new Set();

// 1. Start Game Loop
window.startGame = function() {
    score = 0;
    timeLeft = 60;
    sessionAchievements.clear();
    
    // Reset UI
    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    
    // Switch Screens
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('game-over-screen').style.display = 'none';

    // Start Audio
    const bgm = document.getElementById('bgm');
    if(bgm) {
        bgm.volume = 0.3; 
        bgm.play().catch(e => console.log("Audio play failed:", e));
    }

    // Start Timer
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    loadNextInteraction();
}

// 2. Timer Tick
function updateTimer() {
    timeLeft--;
    document.getElementById('time').innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

// 3. Load Next State (Replace with your specific module logic)
function loadNextInteraction() {
    // e.g., Generate a new math problem, load a new image, etc.
    document.getElementById('main-display').innerText = "Keep clicking!";
}

// 4. Handle User Interaction
window.scorePoint = function() {
    score++;
    document.getElementById('score').innerText = score;
    
    const correctSound = document.getElementById('sound-correct');
    if(correctSound) correctSound.play();

    // Achievement Trigger Example
    if (score === 1 && !sessionAchievements.has('first_click')) {
        sessionAchievements.add('first_click');
        triggerAchievement('first_click', 50);
        confetti({ particleCount: 50, spread: 40 });
    }

    loadNextInteraction();
}

// 5. Game Over Sequence
function endGame() {
    clearInterval(timerInterval);
    
    const bgm = document.getElementById('bgm');
    if(bgm) bgm.pause(); 
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}

// Optional: Run any pre-loading logic when the file is read
window.onload = () => {
    console.log("Hello World Engine Loaded!");
    // document.getElementById('start-btn').disabled = false;
};
