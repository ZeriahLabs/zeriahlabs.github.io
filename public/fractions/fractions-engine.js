/*
  =============================================================================
  ZERIAH LABS ENGINE: Pizza Fractions
  =============================================================================
*/

// ==========================================
// CORE: Achievement Engine (Baseline Standard)
// ==========================================
async function triggerAchievement(achievementId, xpReward) {
    const userId = localStorage.getItem('zeriah_token');
    
    if (!userId || userId === "local_test_token_123") {
        console.log(`[TESTING] Unlocked: [${achievementId}] for ${xpReward}XP`);
        return;
    }

    try {
        const response = await fetch('/api/unlock-achievement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, achievementId, xpReward })
        });
        
        const result = await response.json();
        
        if (result.isLevelUp || result.success) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        }
        
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement API failed:", err);
    }
}

// DOM Elements
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById('game-container');
const visualArea = document.getElementById('visual-area');
const questionText = document.getElementById('question-text');
const choicesArea = document.getElementById('choices-area');
const scoreDisplay = document.getElementById('score');

// Audio Setup (Using Absolute Paths per Baseline)
const bgm = new Audio('/sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3; 

const sfxYay = new Audio('/sounds/yay.mp3');
const sfxWrong = new Audio('/sounds/wrong.mp3');

// Color Palette
const COLORS = {
    blue: '#00d0ff',    // var(--brand)
    orange: '#a855f7',  // var(--purple)
    line: '#eef6ff',    // var(--ink)
    cross: '#07101a',   // Cut-out look using body bg color
    empty: 'rgba(255, 255, 255, 0.05)' 
};

// Game State
let score = 0;
let correctAnswer = "";
let sessionAchievements = new Set(); // Prevent API spam

// Initialization
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    
    bgm.play().catch(e => console.log("Audio play failed:", e));
    
    score = 0;
    scoreDisplay.textContent = score;
    sessionAchievements.clear();
    
    generateQuestion();
});

function handleChoice(selected) {
    if (selected === correctAnswer) {
        sfxYay.currentTime = 0;
        sfxYay.play().catch(e => console.log(e));
        
        score += 10;
        scoreDisplay.textContent = score;
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, zIndex: 9999 });

        // Achievement Triggers (D1 Hook)
        if (score === 50 && !sessionAchievements.has('fractions_beginner')) {
            sessionAchievements.add('fractions_beginner');
            triggerAchievement('fractions_beginner', 50);
        }
        if (score === 150 && !sessionAchievements.has('fractions_scholar')) {
            sessionAchievements.add('fractions_scholar');
            triggerAchievement('fractions_scholar', 100);
        }
        if (score === 300 && !sessionAchievements.has('fractions_master')) {
            sessionAchievements.add('fractions_master');
            triggerAchievement('fractions_master', 200);
        }
        
        generateQuestion();
    } else {
        sfxWrong.currentTime = 0;
        sfxWrong.play().catch(e => console.log(e));
        
        visualArea.style.transition = "transform 0.1s";
        visualArea.style.transform = "translateX(10px)";
        setTimeout(() => visualArea.style.transform = "translateX(-10px)", 100);
        setTimeout(() => visualArea.style.transform = "translateX(0)", 200);
    }
}

function generateQuestion() {
    visualArea.innerHTML = '';
    choicesArea.innerHTML = '';
    
    const denominators = [4, 5, 6, 8, 9, 10, 12];
    const denominator = denominators[Math.floor(Math.random() * denominators.length)];
    
    const num1 = Math.floor(Math.random() * denominator) + 1;
    const num2 = Math.floor(Math.random() * denominator) + 1;
    const isAdd = Math.random() > 0.5;

    let ansNum = 0;
    
    if (isAdd) {
        ansNum = num1 + num2;
        questionText.textContent = `${num1}/${denominator} + ${num2}/${denominator} = ?`;
    } else {
        // Ensure positive result for subtraction
        if (num1 < num2) {
            ansNum = num2 - num1;
            questionText.textContent = `${num2}/${denominator} - ${num1}/${denominator} = ?`;
        } else {
            ansNum = num1 - num2;
            questionText.textContent = `${num1}/${denominator} - ${num2}/${denominator} = ?`;
        }
    }

    correctAnswer = `${ansNum}/${denominator}`;
    
    // Abstracting out the rendering function
    renderVisuals(isAdd ? num1 : Math.max(num1, num2), isAdd ? num2 : Math.min(num1, num2), denominator, isAdd);
    generateChoices(ansNum, denominator);
}

function generateChoices(correctNum, denominator) {
    const choices = new Set([correctNum]);
    
    while (choices.size < 3) {
        const offset = Math.floor(Math.random() * 5) - 2;
        if (offset !== 0 && correctNum + offset > 0) {
            choices.add(correctNum + offset);
        }
    }

    Array.from(choices)
        .sort(() => Math.random() - 0.5)
        .forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = `${num}/${denominator}`;
            btn.onclick = () => handleChoice(`${num}/${denominator}`);
            choicesArea.appendChild(btn);
        });
}

function renderVisuals(val1, val2, den, isAdd) {
    // Add logic here to draw circles based on val1, val2 and denominator
    // Placeholder rendering logic
    const cvs = document.createElement('canvas');
    cvs.width = 200; cvs.height = 200;
    const ctx = cvs.getContext('2d');
    visualArea.appendChild(cvs);
    
    ctx.beginPath();
    ctx.arc(100, 100, 90, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.empty;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORS.line;
    ctx.stroke();
    
    const sliceAngle = (2 * Math.PI) / den;
    
    // Draw filled slices
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.arc(100, 100, 90, -Math.PI / 2, -Math.PI / 2 + (val1 * sliceAngle));
    ctx.lineTo(100, 100);
    ctx.fillStyle = COLORS.blue;
    ctx.fill();
    ctx.stroke();
}
