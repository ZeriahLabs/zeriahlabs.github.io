/*
  =============================================================================
  ZERIAH LABS ENGINE: What's Going On? (Photographic Memory)
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

// --- 1. SETUP AUDIO ---
// Converted to absolute paths
const sndCorrect = new Audio('/sounds/yay.mp3');
const sndWrong = new Audio('/sounds/wrong.mp3');
const bgm = new Audio('/sounds/bgm.mp3');

// Configure Background Music
bgm.loop = true;      
bgm.volume = 0.2;     

// --- 2. GAME DATA ---
const CSV_URL = 'https://assets.zeriahlabs.com/whats-going-on/whats_going_on.csv';
let gameDatabase = {}; 
let imageList = [];
let unplayedImages = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let isTransitioningImage = false;

// Tracking
let score = 0;
let sessionAchievements = new Set();

// Helper function: Parses CSV safely
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes; 
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Fetches the CSV from R2 and structures it
async function initGame() {
    const btn = document.getElementById('start-btn');
    btn.innerText = "Loading data...";
    btn.disabled = true;

    try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        
        const lines = text.split('\n');
        
        // Loop starts at 1 to skip header row
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const cols = parseCSVRow(lines[i]);
            const imageURL = cols[0];
            
            if (!gameDatabase[imageURL]) {
                gameDatabase[imageURL] = [];
                imageList.push(imageURL);
            }
            
            gameDatabase[imageURL].push({
                question: cols[1],
                options: [cols[2], cols[3], cols[4]],
                correct: parseInt(cols[5], 10)
            });
        }
        
        // Populate deck
        unplayedImages = [...imageList];
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-image').style.display = 'block';
        
        bgm.play().catch(e => console.log(e));
        
        startRound();
        
    } catch (error) {
        console.error("Error loading CSV:", error);
        btn.innerText = "Error loading. Try again.";
        btn.disabled = false;
    }
}

function startRound() {
    if (unplayedImages.length === 0) {
        // Reshuffle if deck is empty
        unplayedImages = [...imageList];
    }

    // Pick random image from unplayed
    const randomIdx = Math.floor(Math.random() * unplayedImages.length);
    const selectedImage = unplayedImages[randomIdx];
    
    // Remove it from the unplayed pool
    unplayedImages.splice(randomIdx, 1);
    
    currentQuestions = gameDatabase[selectedImage];
    currentQuestionIndex = 0;
    
    const imgEl = document.getElementById('game-image');
    const prepScreen = document.getElementById('prep-screen');
    
    // 1. Initial State: Blurred with prep text
    imgEl.src = selectedImage;
    imgEl.style.filter = 'blur(10px) brightness(0.3)';
    prepScreen.style.display = 'flex';
    
    // 2. Clear picture after 2 seconds
    setTimeout(() => {
        prepScreen.style.display = 'none';
        imgEl.style.filter = 'none';
        
        // 3. Darken picture after 7 seconds of clarity
        setTimeout(() => {
            imgEl.style.filter = 'brightness(0.15) blur(3px)';
            showQuestion(currentQuestions[currentQuestionIndex]);
        }, 7000);
        
    }, 2000);
}

function showQuestion(qData) {
    document.getElementById('question-text').innerText = qData.question;
    
    // Update buttons safely
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`opt-${i}`);
        if(btn) btn.innerText = qData.options[i];
    }
    
    document.getElementById('question-container').style.display = 'block';
}

function checkAnswer(selectedIndex) {
    const currentQ = currentQuestions[currentQuestionIndex];
    
    if (selectedIndex === currentQ.correct) {
        sndCorrect.currentTime = 0; 
        sndCorrect.play();
        
        // Update Score
        score += 10;
        document.getElementById('score').innerText = score;
        
        // Milestone checks
        checkMilestones();

        showCustomAlert("Correct! Great memory."); 
    } else {
        sndWrong.currentTime = 0; 
        sndWrong.play();
        showCustomAlert("Oops! The correct answer was:\n" + currentQ.options[currentQ.correct]);
    }
}

// Check score against D1 milestones
function checkMilestones() {
    if (score >= 50 && !sessionAchievements.has('memory_apprentice')) {
        sessionAchievements.add('memory_apprentice');
        triggerAchievement('memory_apprentice', 50);
    }
    if (score >= 150 && !sessionAchievements.has('memory_photographic')) {
        sessionAchievements.add('memory_photographic');
        triggerAchievement('memory_photographic', 100);
    }
    if (score >= 300 && !sessionAchievements.has('memory_master')) {
        sessionAchievements.add('memory_master');
        triggerAchievement('memory_master', 200);
    }
}

// Shows our fancy centered popup instead of the browser default
function showCustomAlert(message) {
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('custom-alert-text').innerText = message;
    document.getElementById('custom-alert').style.display = 'block';
}

// Triggered when the user clicks "Next" on our popup
window.handleAlertClick = function() {
    document.getElementById('custom-alert').style.display = 'none';

    if (isTransitioningImage) {
        isTransitioningImage = false;
        startRound();
        return;
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion(currentQuestions[currentQuestionIndex]);
    } else {
        isTransitioningImage = true;
        showCustomAlert("Picture complete! Loading the next one...");
    }
}
