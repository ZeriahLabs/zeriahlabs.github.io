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

// Audio Setup
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
        
        // Restore correct column mappings!
        if (cols[0] && cols[1]) names.push({ name: cols[0], gender: cols[1] });
        if (cols[2] && cols[3] && cols[4]) objects.push({ item: cols[2], emojiUrl: cols[3], objClass: cols[4] });
        if (cols[5] && cols[6] && cols[7]) actions.push({ actClass: cols[5], verb: cols[6], operator: cols[7], preposition: cols[8] || '' });
    });
}

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

    // Reset UI
    document.getElementById('answers-container').style.display = 'flex';
    document.getElementById('math-ans').innerText = '?';

    // 1. Pick Variables intelligently based on Class
    const selectedObj = getRandom(objects);
    const validActions = actions.filter(a => a.actClass === selectedObj.objClass);
    const selectedAction = validActions.length > 0 ? getRandom(validActions) : actions[0];
    
    const person1 = getRandom(names);
    let person2 = getRandom(names);
    while(person1.name === person2.name) { person2 = getRandom(names); }
    
    const pronoun = person1.gender === 'm' ? 'He' : 'She';

    // 2. Generate Numbers
    let num1 = Math.floor(Math.random() * 5) + 3; // 3 to 7
    let num2 = Math.floor(Math.random() * 4) + 2; // 2 to 5

    let mathOp = selectedAction.operator;
    
    // Ensure no negative numbers for kids
    if (mathOp === "-") {
        if (num2 > num1) {
            let temp = num1;
            num1 = num2;
            num2 = temp;
        }
        correctAnswer = num1 - num2;
    } else {
        correctAnswer = num1 + num2;
    }

    // 3. Construct the Sentence
    let sentence = `${person1.name} has ${num1} ${selectedObj.item}. `;
    if (selectedAction.preposition !== '') {
        sentence += `${pronoun} ${selectedAction.verb} ${num2} ${selectedObj.item} ${selectedAction.preposition} ${person2.name}. `;
    } else {
        sentence += `${pronoun} ${selectedAction.verb} ${num2} of them. `;
    }
    
    if (mathOp === '+') {
        sentence += `How many ${selectedObj.item} does ${person1.name} have in total?`;
    } else {
        sentence += `How many ${selectedObj.item} does ${person1.name} have left?`;
    }
    currentProblemText = sentence;

    // 4. Update the DOM
    document.getElementById('problem-text').innerText = sentence;
    renderVisuals(selectedObj.emojiUrl, num1, num2, mathOp);
    renderMath(num1, num2, mathOp);
    generateOptions(correctAnswer);
    
    readQuestion();
}

function renderVisuals(emojiUrl, num1, num2, type) {
    const container = document.getElementById('visual-container');
    container.innerHTML = "";

    // Generate actual <img> tags instead of repeating text
    const createImgGroup = (count) => {
        const group = document.createElement('div');
        group.className = 'animate-pop';
        group.style.display = 'flex';
        group.style.flexWrap = 'wrap';
        group.style.justifyContent = 'center';
        group.style.gap = '5px';
        
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = emojiUrl;
            img.style.width = '60px'; // Made them nice and big
            img.style.height = '60px';
            img.style.objectFit = 'contain';
            group.appendChild(img);
        }
        return group;
    };

    container.appendChild(createImgGroup(num1));

    const symbol = document.createElement('div');
    symbol.innerText = type; 
    symbol.style.margin = "0 15px";
    symbol.style.color = "var(--brand2)";
    symbol.style.display = "flex";
    symbol.style.alignItems = "center";
    container.appendChild(symbol);

    container.appendChild(createImgGroup(num2));
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
        if (wrong >= 0 && !options.includes(wrong)) {
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
        setTimeout(generateProblem, 2500);
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
