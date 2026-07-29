/*
  =============================================================================
  ZERIAH LABS ENGINE: Procedural Math Word Problems
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

const CSV_URL = 'https://assets.zeriahlabs.com/word-problems/word-problems-generator.csv?v=1';

// DOM Elements
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');

// Audio Setup via HTML Elements
const bgm = document.getElementById('bgm');
if(bgm) bgm.volume = 0.2; 
let bgmStarted = false;

const sfxYay = document.getElementById('sound-correct');
const sfxWrong = document.getElementById('sound-wrong');

let names = [];
let objects = [];
let actions = [];
let currentProblemText = "";
let isDataLoaded = false;

let score = 0;
let correctAnswer = 0;
let sessionAchievements = new Set();

// --- 1. FETCH AND PARSE THE CSV ---
async function initializeEngine() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();
        parseCSV(csvText);
        isDataLoaded = true;
        
        startBtn.innerText = "Start Game";
        startBtn.disabled = false;
    } catch (error) {
        console.error("Failed to load CSV:", error);
        startBtn.innerText = "Error loading data.";
    }
}

function parseCSV(csvData) {
    const rows = csvData.split('\n').slice(1);
    rows.forEach(row => {
        const cleanRow = row.replace('\r', '');
        const cols = cleanRow.split(',');
        if (cols[0] && cols[1]) names.push({ name: cols[0], gender: cols[1] });
        if (cols[2] && cols[3]) objects.push({ emoji: cols[2], plural: cols[3] });
        if (cols[4] && cols[5]) actions.push({ type: cols[4], text: cols[5] });
    });
}

// Start Game Flow
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    
    score = 0;
    scoreDisplay.textContent = score;
    sessionAchievements.clear();
    
    generateProblem();
});

// --- 2. GENERATOR LOGIC ---
function generateProblem() {
    if (!isDataLoaded) return;

    // Reset UI for new question
    document.getElementById('answers-container').style.display = 'flex';
    document.getElementById('math-ans').innerText = '?';

    const person = names[Math.floor(Math.random() * names.length)];
    const obj = objects[Math.floor(Math.random() * objects.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const num1 = Math.floor(Math.random() * 5) + 3; // 3 to 7
    let num2 = Math.floor(Math.random() * 4) + 2;   // 2 to 5 (Ensures plural!)

    let mathOp = "+";
    if (action.type === "subtraction") {
        if (num2 > num1) {
            let temp = num1;
            num1 = num2;
            num2 = temp;
        }
        correctAnswer = num1 - num2;
        mathOp = "-";
    } else {
        correctAnswer = num1 + num2;
    }

    const pronoun = person.gender === "M" ? "He" : "She";
    const actionText = action.text.replace("{pronoun}", pronoun);

    currentProblemText = `${person.name} has ${num1} ${obj.plural}. ${actionText} ${num2} more ${obj.plural}. How many ${obj.plural} does ${person.name} have now?`;

    document.getElementById('problem-text').innerText = currentProblemText;
    
    renderVisuals(obj.emoji, num1, num2, action.type);
    renderMath(num1, num2, mathOp);
    generateOptions(correctAnswer);
    
    readQuestion();
}

function renderVisuals(emoji, num1, num2, type) {
    const container = document.getElementById('visual-container');
    container.innerHTML = "";

    const group1 = document.createElement('div');
    group1.innerText = emoji.repeat(num1);
    group1.className = 'animate-pop';
    container.appendChild(group1);

    const symbol = document.createElement('div');
    symbol.innerText = type === "addition" ? "➕" : "➖";
    symbol.style.margin = "0 15px";
    container.appendChild(symbol);

    const group2 = document.createElement('div');
    group2.innerText = emoji.repeat(num2);
    group2.className = 'animate-pop';
    container.appendChild(group2);
}

function renderMath(num1, num2, op) {
    const mathDiv = document.getElementById('math-container');
    mathDiv.style.display = 'inline-block';
    
    document.getElementById('math-num1').innerText = num1;
    document.getElementById('math-num2').innerText = num2;
    document.getElementById('math-op').innerText = op;
}

function generateOptions(correct) {
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = "";

    let options = [correct];
    while (options.length < 3) {
        let wrong = correct + (Math.floor(Math.random() * 5) - 2);
        if (wrong > 0 && !options.includes(wrong)) {
            options.push(wrong);
        }
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'ans-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, correct);
        answersContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct) {
    if (!bgmStarted && bgm) {
        bgm.play().catch(e => console.log(e));
        bgmStarted = true;
    }

    if (selected === correct) {
        if(sfxYay) { sfxYay.currentTime = 0; sfxYay.play(); }
        
        document.getElementById('math-ans').innerText = correct; 
        document.getElementById('answers-container').style.display = 'none'; 
        
        score += 10;
        scoreDisplay.textContent = score;
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, zIndex: 9999 });

        // Achievement Check
        if (score === 50 && !sessionAchievements.has('wordproblem_solver')) {
            sessionAchievements.add('wordproblem_solver');
            triggerAchievement('wordproblem_solver', 50);
        }
        if (score === 150 && !sessionAchievements.has('wordproblem_expert')) {
            sessionAchievements.add('wordproblem_expert');
            triggerAchievement('wordproblem_expert', 100);
        }
        if (score === 300 && !sessionAchievements.has('wordproblem_master')) {
            sessionAchievements.add('wordproblem_master');
            triggerAchievement('wordproblem_master', 200);
        }

        // Auto-advance after celebration
        setTimeout(generateProblem, 2000);
    } else {
        if(sfxWrong) { sfxWrong.currentTime = 0; sfxWrong.play(); }
    }
}

// --- 5. TEXT-TO-SPEECH ---
function readQuestion() {
    if (!currentProblemText) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(currentProblemText);
        utterance.rate = 0.9; 
        utterance.pitch = 1.1; 
        window.speechSynthesis.speak(utterance);
    }
}

window.speechSynthesis.onvoiceschanged = () => {};
document.getElementById('read-btn').addEventListener('click', readQuestion);

// Boot up
initializeEngine();
