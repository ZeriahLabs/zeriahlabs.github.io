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
            // Zeriah Signature Level Up Celebration!
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        // Redraw the UI to show the newly unlocked badge
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement failed", err);
    }
}

// ==========================================
// DINO GUESS: Game Logic
// ==========================================
let dinosaurDB = [];
let currentDino;
let score = 0;
let timeLeft = 60;
let timerInterval;
let isRevealed = false;
let streak = 0;
let previousDino = null;

// Track achievements locally so we don't spam the API if they stay at a score
let sessionAchievements = new Set();

// 1. Fetch and Parse the CSV
async function loadDinosaurCSV() {
    try {
        const response = await fetch('./dinos.csv');
        if (!response.ok) throw new Error("CSV file not found at ./dinos.csv");
        
        const text = await response.text();
        const rows = text.replace(/\r/g, '').split('\n').map(r => r.trim()).filter(r => r);
        const dataRows = rows.slice(1); 

        dinosaurDB = dataRows.map(row => {
            const cols = row.split(',').map(c => c.trim());
            if (cols.length >= 6) {
                return {
                    img: cols[0],
                    options: [cols[1], cols[2], cols[3], cols[4]],
                    name: cols[5],
                    author: cols[6] || "" 
                };
            }
            return null;
        }).filter(d => d !== null);

        if (dinosaurDB.length > 0) {
            const startBtn = document.getElementById('start-btn');
            startBtn.innerText = "Start Game";
            startBtn.disabled = false;
        } else {
            document.getElementById('start-btn').innerText = "Error: CSV is empty";
        }
    } catch (error) {
        console.error("CSV Load Error:", error);
        document.getElementById('start-btn').innerText = "Error loading dinos.csv";
    }
}

// 2. Gameplay Loop
window.startGame = function() { // Attach to window so HTML button can find it
    score = 0;
    timeLeft = 60;
    streak = 0;
    sessionAchievements.clear(); // Reset session locks
    
    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('game-over-screen').style.display = 'none';

    const bgm = document.getElementById('bgm');
    bgm.volume = 0.3; 
    bgm.play().catch(e => console.log("Audio play failed:", e));

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    
    loadNextDinosaur();
}

function updateTimer() {
    timeLeft--;
    document.getElementById('time').innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

function loadNextDinosaur() {
    isRevealed = false;
    const dinoDisplay = document.getElementById('dino-display');
    
    dinoDisplay.style.display = 'block';
    dinoDisplay.classList.add('silhouette');
    document.getElementById('attribution-text').style.display = 'none'; 
    document.getElementById('question-text').innerText = "Who's That Dinosaur?";
    
    // Pick a random dino, no back-to-back duplicates
    if (dinosaurDB.length > 1) {
        do {
            currentDino = dinosaurDB[Math.floor(Math.random() * dinosaurDB.length)];
        } while (previousDino && currentDino.name === previousDino.name);
    } else {
        currentDino = dinosaurDB[0];
    }
    
    previousDino = currentDino;
    dinoDisplay.src = currentDino.img;

    let shuffledOptions = [...currentDino.options].sort(() => Math.random() - 0.5);

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    shuffledOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => checkAnswer(option, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedName, btnElement) {
    if (isRevealed) return; 
    isRevealed = true;

    const buttons = document.querySelectorAll('.option-btn');
    const timeEl = document.getElementById('time');
    
    if (selectedName === currentDino.name) {
        btnElement.classList.add('correct');
        document.getElementById('sound-correct').play();
        
        score++;
        streak++;
        timeLeft += 3; 
        
        document.getElementById('score').innerText = score;
        timeEl.style.color = 'var(--brand2)';
        timeEl.innerText = `+3s`;
        setTimeout(() => { timeEl.style.color = ''; timeEl.innerText = timeLeft; }, 500);

        document.getElementById('question-text').innerText = `It's ${currentDino.name}!`;

        if (streak % 5 === 0) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        // ==========================================
        // ACHIEVEMENT TRIGGERS!
        // ==========================================
        if (score === 10 && !sessionAchievements.has('dino_master')) {
            sessionAchievements.add('dino_master');
            triggerAchievement('dino_master', 100);
        }
        if (score === 20 && !sessionAchievements.has('dino_expert')) {
            sessionAchievements.add('dino_expert');
            triggerAchievement('dino_expert', 200);
        }
        if (score === 30 && !sessionAchievements.has('trex_master')) {
            sessionAchievements.add('trex_master');
            triggerAchievement('trex_master', 300);
        }

    } else {
        btnElement.classList.add('wrong');
        document.getElementById('sound-wrong').play();
        
        streak = 0;
        document.getElementById('question-text').innerText = `Nope! It's ${currentDino.name}!`;
        
        buttons.forEach(b => {
            if (b.innerText === currentDino.name) b.classList.add('correct');
        });
    }

    document.getElementById('dino-display').classList.remove('silhouette');
    
    if(currentDino.author) {
        const attributionEl = document.getElementById('attribution-text');
        attributionEl.innerHTML = `Original image by ${currentDino.author} / <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" style="color: inherit; text-decoration: underline;">CC BY 4.0</a> / Modified from original`;
        attributionEl.style.display = 'block';
    }

    setTimeout(loadNextDinosaur, 1500);
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('bgm').pause(); 
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').innerText = score;
    
    let rank = "Egg";
    if(score > 5) rank = "Hatchling";
    if(score > 15) rank = "Raptor Rider";
    if(score > 30) rank = "T-Rex Master!";
    document.getElementById('rank').innerText = rank;
}

// Boot up by loading the CSV when the script loads
window.onload = loadDinosaurCSV;
