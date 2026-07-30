/*
  =============================================================================
  ZERIAH LABS ENGINE: Calculus Junior
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

// Game State
let currentQuestion = null;
let currentStreak = 0;
let hasAnswered = false;
let currentLevel = 1; 
let sessionAchievements = new Set();

// Audio Engine (Using HTML elements for cleaner mobile playback)
const bgm = document.getElementById('bgm');
if(bgm) bgm.volume = 0.3; 
const yaySound = document.getElementById('sound-correct');
if(yaySound) yaySound.volume = 0.6;
const wrongSound = document.getElementById('sound-wrong');
if(wrongSound) wrongSound.volume = 0.5;

let bgmStarted = false;
function initializeAudio() {
    if (!bgmStarted && bgm) {
        bgm.play().catch(e => console.log("BGM playback prevented by browser:", e));
        bgmStarted = true;
    }
}

// DOM Elements
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById('game-container');
const mathContainer = document.getElementById('math-container');
const mcqContainer = document.getElementById('mcq-container');
const actionButtons = document.getElementById('action-buttons');
const showStepsBtn = document.getElementById('show-steps-btn');
const nextQBtn = document.getElementById('next-q-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const stepsContainer = document.getElementById('steps-container');
const streakDisplay = document.getElementById('streak');
const levelTitle = document.getElementById('level-title');

// Boot Sequence
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    initializeAudio();
    startRound();
});

function generateQuestion() {
    const qTypesLevel1 = [
        { type: "power", title: "Power Rule (Basic)" },
        { type: "constant", title: "Constant Rule" }
    ];
    const qTypesLevel2 = [
        { type: "sum", title: "Sum/Difference Rule" },
        { type: "power_advanced", title: "Power Rule (Negative/Fractions)" }
    ];
    const qTypesLevel3 = [
        { type: "product", title: "Product Rule" },
        { type: "chain_basic", title: "Chain Rule (Basic)" }
    ];

    let pool = qTypesLevel1;
    if (currentLevel === 2) pool = qTypesLevel2;
    if (currentLevel === 3) pool = qTypesLevel3;
    
    let qType = pool[Math.floor(Math.random() * pool.length)];

    // BOSS LOGIC
    if (currentStreak === 4 && currentLevel === 1) qType = { type: "boss_chain", title: "BOSS STAGE: The Chain Rule" };
    if (currentStreak === 9 && currentLevel === 2) qType = { type: "boss_product", title: "BOSS STAGE: The Product Rule" };
    if (currentStreak === 14 && currentLevel === 3) qType = { type: "boss_quotient", title: "BOSS STAGE: The Quotient Rule" };

    levelTitle.innerText = `Level ${Math.floor(currentLevel)}: ${qType.title}`;
    
    // Generate Math based on Type
    if (qType.type === "power") {
        const c = Math.floor(Math.random() * 8) + 2; 
        const p = Math.floor(Math.random() * 5) + 2; 
        const ansC = c * p;
        const ansP = p - 1;
        const ans = ansP === 1 ? `${ansC}x` : `${ansC}x^{${ansP}}`;
        return {
            level: 1,
            equation: `f(x) = ${c}x^{${p}}`,
            correctAnswer: ans,
            wrongAnswers: [`${c}x^{${p-1}}`, `${ansC}x^{${p}}`, `${c*p+1}x^{${p-1}}`],
            steps: [
                { instruction: "Identify the coefficient and exponent.", math: `c = ${c}, n = ${p}` },
                { instruction: "Multiply the coefficient by the exponent.", math: `${c} \\times ${p} = ${ansC}` },
                { instruction: "Subtract 1 from the exponent.", math: `${p} - 1 = ${ansP}` },
                { instruction: "Combine for the final derivative.", math: `f'(x) = ${ans}` }
            ]
        };
    } else if (qType.type === "constant") {
        const c = Math.floor(Math.random() * 100) + 1;
        return {
            level: 1,
            equation: `f(x) = ${c}`,
            correctAnswer: "0",
            wrongAnswers: ["1", `${c}`, "x"],
            steps: [
                { instruction: "Identify that the function is a constant (no x terms).", math: `f(x) = c` },
                { instruction: "The derivative of any constant is always 0.", math: `\\frac{d}{dx}[c] = 0` }
            ]
        };
    } else if (qType.type === "sum") {
        return {
            level: 2,
            equation: `f(x) = 3x^3 - 2x^2 + 5x - 7`,
            correctAnswer: `9x^2 - 4x + 5`,
            wrongAnswers: [`9x^2 - 4x`, `3x^2 - 2x + 5`, `9x^3 - 4x^2 + 5x`],
            steps: [
                { instruction: "Take the derivative of each term separately.", math: `\\frac{d}{dx}[3x^3] - \\frac{d}{dx}[2x^2] + \\frac{d}{dx}[5x] - \\frac{d}{dx}[7]` },
                { instruction: "Apply Power Rule to terms 1 and 2.", math: `9x^2 - 4x` },
                { instruction: "Apply Power Rule to term 3, Constant Rule to term 4.", math: `5 - 0` },
                { instruction: "Combine.", math: `f'(x) = 9x^2 - 4x + 5` }
            ]
        };
    } else if (qType.type === "boss_chain") {
        return {
            level: 1.5, 
            equation: `f(x) = (3x^2 + 2)^4`,
            correctAnswer: `24x(3x^2 + 2)^3`,
            wrongAnswers: [`4(3x^2 + 2)^3`, `12x(3x^2 + 2)^3`, `24x(6x)^3`],
            steps: [
                { instruction: "Identify the 'outside' and 'inside' functions.", math: `u = 3x^2 + 2` },
                { instruction: "Take derivative of the outside (Power Rule), leave inside alone.", math: `4(3x^2 + 2)^3` },
                { instruction: "Take derivative of the inside.", math: `u' = 6x` },
                { instruction: "Multiply them together (Chain Rule).", math: `4(3x^2 + 2)^3 \\cdot 6x = 24x(3x^2 + 2)^3` }
            ]
        };
    } else if (qType.type === "boss_product") {
         return {
            level: 2.5, 
            equation: `f(x) = x^2 \\sin(x)`,
            correctAnswer: `x^2 \\cos(x) + 2x \\sin(x)`,
            wrongAnswers: [`2x \\cos(x)`, `x^2 \\cos(x) - 2x \\sin(x)`, `2x \\sin(x)`],
            steps: [
                { instruction: "Identify u and v.", math: `u = x^2, v = \\sin(x)` },
                { instruction: "Find u' and v'.", math: `u' = 2x, v' = \\cos(x)` },
                { instruction: "Apply Product Rule: u v' + v u'", math: `x^2 \\cos(x) + \\sin(x)(2x)` }
            ]
        };
    }
    
    // Fallback if missing
    return {
        level: 1, equation: `f(x) = x^2`, correctAnswer: `2x`, wrongAnswers: [`x`, `2x^2`, `2`],
        steps: [{ instruction: "Power rule.", math: `2x^{2-1}` }]
    };
}

function startRound() {
    hasAnswered = false;
    currentQuestion = generateQuestion();
    
    stepsContainer.style.display = 'none';
    stepsContainer.innerHTML = '';
    showStepsBtn.style.display = 'none';
    nextQBtn.style.display = 'none';
    upgradeBtn.style.display = 'none';
    
    katex.render(currentQuestion.equation, mathContainer, { displayMode: true, throwOnError: false });

    mcqContainer.innerHTML = '';
    
    let options = [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers];
    options.sort(() => Math.random() - 0.5); 

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        const span = document.createElement('span');
        katex.render(opt, span, { displayMode: false, throwOnError: false });
        btn.appendChild(span);
        
        btn.addEventListener('click', () => handleAnswer(opt === currentQuestion.correctAnswer, btn));
        mcqContainer.appendChild(btn);
    });
}

function handleAnswer(isCorrect, btn) {
    if (hasAnswered) return;
    hasAnswered = true;
    initializeAudio();

    const buttons = mcqContainer.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.add('btn-correct');
        if(yaySound) { yaySound.currentTime = 0; yaySound.play(); }
        
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, zIndex: 9999 });
        
        currentStreak++;
        streakDisplay.innerText = currentStreak;

        // Boss progression UI & Achievements
        if (currentQuestion.level % 1 !== 0) { 
            let nextLevelText = "Next Level";
            if (currentQuestion.level === 1.5) {
                nextLevelText = "Level Up: Unlock Sum Rule!";
                if(!sessionAchievements.has('calc_chain')) { sessionAchievements.add('calc_chain'); triggerAchievement('calc_chain', 100); }
            } else if (currentQuestion.level === 2.5) {
                nextLevelText = "Level Up: Unlock Product Rule!";
                if(!sessionAchievements.has('calc_product')) { sessionAchievements.add('calc_product'); triggerAchievement('calc_product', 150); }
            }
            
            upgradeBtn.innerText = `🚀 Boss Defeated: ${nextLevelText}`;
            upgradeBtn.style.display = 'block';
        } else {
            nextQBtn.style.display = 'block';
        }
        
        // General streak achievement
        if (currentStreak === 5 && !sessionAchievements.has('calc_streak')) {
            sessionAchievements.add('calc_streak');
            triggerAchievement('calc_streak', 50);
        }

    } else {
        btn.classList.add('btn-wrong');
        if(wrongSound) { wrongSound.currentTime = 0; wrongSound.play(); }
        
        currentStreak = 0;
        streakDisplay.innerText = currentStreak;
        
        // Show correct answer
        buttons.forEach(b => {
            if (b.innerHTML.includes(currentQuestion.correctAnswer.replace(/\\/g, '\\\\'))) {
                b.classList.add('btn-correct');
                b.style.opacity = '1'; 
            }
        });
        
        showStepsBtn.style.display = 'block';
        nextQBtn.style.display = 'block';
    }
}

function showSteps() {
    stepsContainer.style.display = 'block';
    stepsContainer.innerHTML = '<h3 style="color: var(--brand); margin-top: 0;">Step-by-Step Solution</h3>';
    
    currentQuestion.steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.style.animationDelay = `${index * 0.4}s`; 

        const instructionText = document.createElement('div');
        instructionText.className = 'step-instruction';
        instructionText.innerText = step.instruction;

        const mathRenderDiv = document.createElement('div');
        mathRenderDiv.className = 'step-math';
        katex.render(step.math, mathRenderDiv);

        stepDiv.appendChild(instructionText);
        stepDiv.appendChild(mathRenderDiv);
        stepsContainer.appendChild(stepDiv);
    });
    
    showStepsBtn.style.display = 'none';
}

// Event Listeners
nextQBtn.addEventListener('click', startRound);
showStepsBtn.addEventListener('click', showSteps);
upgradeBtn.addEventListener('click', () => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
    if(yaySound) { yaySound.currentTime = 0; yaySound.play(); }

    if (currentQuestion.level === 1.5) {
        currentLevel = 2;
    } else if (currentQuestion.level === 2.5) {
        currentLevel = 3; 
    }

    startRound();
});