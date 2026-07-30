/* ============================================================================= 
ZERIAH LABS ENGINE: Calculus Junior (Definitive Master Engine)
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
            // Background achievement ping successful
        }
        
        // Triggers the UI update in the sidebar if the function exists
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement API failed:", err);
    }
}

// ==========================================
// 🎵 Audio Engine
// ==========================================
const bgm = new Audio('/sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3; 

const yaySound = new Audio('/sounds/yay.mp3');
yaySound.volume = 0.6;

const wrongSound = new Audio('/sounds/wrong.mp3');
wrongSound.volume = 0.5;

let bgmStarted = false;

function initializeAudio() {
    if (!bgmStarted) {
        bgm.play().catch(e => console.log("BGM playback prevented by browser:", e));
        bgmStarted = true;
    }
}

// ==========================================
// 🎮 Game State & DOM Elements
// ==========================================
let currentQuestion = null;
let currentStreak = 0;
let hasAnswered = false;
let currentLevel = 1; 

const mathContainer = document.getElementById('math-container');
const mcqContainer = document.getElementById('mcq-container');
const actionButtons = document.getElementById('action-buttons');
const showStepsBtn = document.getElementById('show-steps-btn');
const nextQBtn = document.getElementById('next-q-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const stepsContainer = document.getElementById('steps-container');
const streakDisplay = document.getElementById('streak');
const levelTitle = document.getElementById('level-title');

// ==========================================
// 🛠️ Helpers & Transcendental Engine
// ==========================================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatTerm(coeff, exponent) {
    if (exponent === 1) return `${coeff}x`;
    if (exponent === 0) return `${coeff}`; 
    return `${coeff}x^{${exponent}}`;
}

function getRandomTerm() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const types = ['poly', 'exp', 'log', 'cos', 'tan'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch(type) {
        case 'poly': return { math: `${a}x^2`, deriv: `${a * 2}x` };
        case 'exp':  return { math: `e^{${a}x}`, deriv: `${a}e^{${a}x}` };
        case 'log':  return { math: `\\ln(${a}x)`, deriv: `\\frac{1}{x}` };
        case 'cos':  return { math: `\\cos(${a}x)`, deriv: `-${a}\\sin(${a}x)` };
        case 'tan':  return { math: `\\tan(${a}x)`, deriv: `${a}\\sec^2(${a}x)` };
    }
}

// ==========================================
// ⚙️ Procedural Generators
// ==========================================

// --- LEVEL 1 ---
function generatePowerRule() {
    const a = Math.floor(Math.random() * 8) + 2; 
    const b = Math.floor(Math.random() * 4) + 2; 
    
    const correctAnswer = formatTerm(a * b, b - 1);
    const wrong1 = formatTerm(a * b, b);       
    const wrong2 = formatTerm(a * b, b + 1);   
    const wrong3 = formatTerm(b, b - 1);       
    
    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 1, title: "Level 1: Power Rule", concept: "Power Rule",
        question_latex: `f(x) = ${a}x^{${b}}`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify the coefficient and the exponent.", math: `a = ${a}, \\quad n = ${b}` },
            { instruction: "2. Multiply the exponent by the coefficient.", math: `${a} \\times ${b} = ${a * b}` },
            { instruction: "3. Subtract 1 from the original exponent.", math: `${b} - 1 = ${b - 1}` },
            { instruction: "4. Combine them for your final derivative.", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

function generateLinearRule() {
    const a = Math.floor(Math.random() * 8) + 2; 
    const correctAnswer = `${a}`; 
    const wrong1 = `${a}x`; 
    const wrong2 = `x`;     
    const wrong3 = `0`;     
    
    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 1.5, title: "Level 1 Boss: The Invisible Exponent! 👾", concept: "Linear Power Rule",
        question_latex: `f(x) = ${a}x`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify the hidden exponent! An 'x' by itself means x^1.", math: `a = ${a}, \\quad n = 1` },
            { instruction: "2. Multiply the exponent by the coefficient.", math: `${a} \\times 1 = ${a}` },
            { instruction: "3. Subtract 1 from the exponent. Remember: x^0 always equals 1!", math: `1 - 1 = 0 \\quad \\rightarrow \\quad x^0 = 1` },
            { instruction: "4. The 'x' vanishes, leaving only the coefficient.", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

// --- LEVEL 2 ---
function generateChainRule() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 8) + 1; 
    const n = Math.floor(Math.random() * 4) + 3; 

    const u = `${a}x^2 + ${b}`;
    const uPrime = `${a * 2}x`; 
    const outerDeriv = `${n}(${u})^{${n - 1}}`;
    const finalCoeff = n * a * 2;
    const correctAnswer = `${finalCoeff}x(${u})^{${n - 1}}`;

    const wrong1 = `${n}(${u})^{${n - 1}}`;       
    const wrong2 = `${finalCoeff}x(${u})^{${n}}`; 
    const wrong3 = `${n * a}x(${u})^{${n - 1}}`;  

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 2, title: "Level 2: Chain Rule 🔗", concept: "Chain Rule",
        question_latex: `f(x) = (${u})^{${n}}`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify the 'Inside' and 'Outside' functions.", math: `\\text{Inside } (u) = ${u} \\quad \\text{Outside} = u^{${n}}` },
            { instruction: "2. Find the derivative of the Inside function (u').", math: `u' = ${uPrime}` },
            { instruction: "3. Find the derivative of the Outside function, leaving 'u' untouched.", math: `${n}(u)^{${n - 1}} \\rightarrow ${outerDeriv}` },
            { instruction: "4. Multiply the Outside derivative by the Inside derivative (u').", math: `${outerDeriv} \\cdot ${uPrime}` },
            { instruction: "5. Combine the coefficients for your final answer!", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

function generateTrigChainRule() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 8) + 1; 

    const u = `${a}x^2 + ${b}`;
    const uPrime = `${a * 2}x`; 
    const correctAnswer = `${uPrime} \\cos(${u})`;

    const wrong1 = `\\cos(${u})`;                   
    const wrong2 = `-${uPrime} \\cos(${u})`;        
    const wrong3 = `${uPrime} \\cos(${uPrime})`;    

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 2.5, title: "Level 2 Boss: The Sine Wave! 🌊", concept: "Trig Chain Rule",
        question_latex: `f(x) = \\sin(${u})`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify the 'Inside' and 'Outside' functions.", math: `\\text{Inside } (u) = ${u} \\quad \\text{Outside} = \\sin(u)` },
            { instruction: "2. Find the derivative of the Inside function (u').", math: `u' = ${uPrime}` },
            { instruction: "3. Find the derivative of the Outside function. (The derivative of sin is cos).", math: `\\sin(u) \\rightarrow \\cos(u)` },
            { instruction: "4. Multiply the Outside derivative by the Inside derivative (u').", math: `\\cos(u) \\cdot ${uPrime}` },
            { instruction: "5. Re-insert your original 'u' to get the final answer!", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

// --- LEVEL 3 ---
function generateProductRule() {
    const termU = getRandomTerm();
    const termV = getRandomTerm();

    const u = termU.math;
    const uPrime = termU.deriv;
    const v = termV.math;
    const vPrime = termV.deriv;

    const correctAnswer = `(${uPrime})(${v}) + (${u})(${vPrime})`;
    const wrong1 = `(${uPrime})(${vPrime})`;                       
    const wrong2 = `(${uPrime})(${v}) - (${u})(${vPrime})`;        
    const wrong3 = `(${u})(${vPrime}) + (${u})(${vPrime})`;        

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 3, title: "Level 3: Product Rule ✖️", concept: "Product Rule",
        question_latex: `f(x) = (${u})(${v})`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' (left) and 'v' (right). Notice the different function types!", math: `u = ${u} \\quad v = ${v}` },
            { instruction: "2. Find u' (Apply specific rules like Trig or Exponential Chain Rules).", math: `u' = ${uPrime}` },
            { instruction: "3. Find v'.", math: `v' = ${vPrime}` },
            { instruction: "4. Write out the Product Rule formula.", math: `\\text{Formula: } (u' \\cdot v) + (u \\cdot v')` },
            { instruction: "5. Plug your pieces into the structure.", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

function generateProductChainBoss() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 4) + 2; 

    const u = `${a}x^2`;
    const uPrime = `${a * 2}x`;
    const v = `\\sin(${b}x)`;
    const vPrime = `${b}\\cos(${b}x)`; 

    const correctAnswer = `(${uPrime})\\sin(${b}x) + (${u})(${vPrime})`;
    const wrong1 = `(${uPrime})(${vPrime})`; 
    const wrong2 = `(${uPrime})\\sin(${b}x) + (${u})(\\cos(${b}x))`; 
    const wrong3 = `(${uPrime})\\sin(${b}x) - (${u})(${vPrime})`; 

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 3.5, title: "Level 3 Boss: The Ultimate Combo! 🐉", concept: "Product + Chain Rule",
        question_latex: `f(x) = ${u} \\sin(${b}x)`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' and 'v'. Note that 'v' is a trig function!", math: `u = ${u} \\quad v = \\sin(${b}x)` },
            { instruction: "2. Find u'.", math: `u' = ${uPrime}` },
            { instruction: "3. Find v'. (Don't forget the Chain Rule for the inside!)", math: `v' = ${vPrime}` },
            { instruction: "4. Apply the Product Rule formula: (u' * v) + (u * v')", math: `(${uPrime}) \\cdot \\sin(${b}x) + (${u}) \\cdot (${vPrime})` },
            { instruction: "5. Final structural answer:", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

function generateTranscendentalBoss() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 5) + 2; 

    const u = `e^{${a}x}`;
    const uPrime = `${a}e^{${a}x}`; 
    const v = `\\ln(${b}x)`;
    const vPrime = `\\frac{1}{x}`; 

    const correctAnswer = `(${uPrime})\\ln(${b}x) + (${u})(\\frac{1}{x})`;
    const wrong1 = `(${uPrime})\\ln(${b}x) + (${u})(\\frac{1}{${b}x})`; 
    const wrong2 = `(e^{${a}x})\\ln(${b}x) + (${u})(\\frac{1}{x})`;     
    const wrong3 = `(${uPrime})(\\frac{1}{x})`;                         

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 3.75, title: "Level 3 Final Boss: Exponential Log! 🌌", concept: "Transcendental Product Rule",
        question_latex: `f(x) = ${u} \\ln(${b}x)`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' and 'v'.", math: `u = ${u} \\quad v = \\ln(${b}x)` },
            { instruction: "2. Find u' (Remember the exponent's chain rule).", math: `u' = ${uPrime}` },
            { instruction: "3. Find v' (In logs, the inner coefficient cancels out!).", math: `v' = \\frac{1}{x}` },
            { instruction: "4. Apply the Product Rule formula: (u'v) + (uv')", math: `(${uPrime}) \\cdot \\ln(${b}x) + (${u}) \\cdot (\\frac{1}{x})` },
            { instruction: "5. Final structural answer:", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

// --- LEVEL 4 ---
function generateQuotientRule() {
    const termU = getRandomTerm();
    const termV = getRandomTerm();

    const u = termU.math;
    const uPrime = termU.deriv;
    const v = termV.math;
    const vPrime = termV.deriv;

    const numeratorCorrect = `(${uPrime})(${v}) - (${u})(${vPrime})`;
    const denomCorrect = `(${v})^2`;
    const correctAnswer = `\\frac{${numeratorCorrect}}{${denomCorrect}}`;

    const wrong1 = `\\frac{(${uPrime})(${v}) + (${u})(${vPrime})}{${denomCorrect}}`; 
    const wrong2 = `\\frac{(${u})(${vPrime}) - (${uPrime})(${v})}{${denomCorrect}}`; 
    const wrong3 = `\\frac{${numeratorCorrect}}{${v}}`;                            

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 4, title: "Level 4: Quotient Rule ➗", concept: "Quotient Rule",
        question_latex: `f(x) = \\frac{${u}}{${v}}`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' (the top) and 'v' (the bottom). Notice the different function types!", math: `u = ${u} \\quad v = ${v}` },
            { instruction: "2. Find the derivative of the top (u').", math: `u' = ${uPrime}` },
            { instruction: "3. Find the derivative of the bottom (v').", math: `v' = ${vPrime}` },
            { instruction: "4. Write out the Quotient Rule formula.", math: `\\text{Formula: } \\frac{(u' \\cdot v) - (u \\cdot v')}{v^2}` },
            { instruction: "5. Plug your pieces into the formula. Order matters!", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

function generateQuotientBoss() {
    const a = Math.floor(Math.random() * 3) + 2; 
    const b = Math.floor(Math.random() * 4) + 2; 

    const u = `\\cos(${a}x^2)`;
    const uPrime = `-${a * 2}x\\sin(${a}x^2)`; 
    const v = `e^{${b}x}`;
    const vPrime = `${b}e^{${b}x}`;

    const numeratorCorrect = `(${uPrime})(${v}) - (${u})(${vPrime})`;
    const denomCorrect = `(${v})^2`;
    const correctAnswer = `\\frac{${numeratorCorrect}}{${denomCorrect}}`;

    const wrong1 = `\\frac{(\\sin(${a}x^2))(${v}) - (${u})(${vPrime})}{${denomCorrect}}`;     
    const wrong2 = `\\frac{(${a * 2}x\\sin(${a}x^2))(${v}) - (${u})(${vPrime})}{${denomCorrect}}`; 
    const wrong3 = `\\frac{(${u})(${vPrime}) - (${uPrime})(${v})}{${denomCorrect}}`;     

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 4.5, title: "Level 4 Boss: The Great Divide! ⚡", concept: "Quotient + Nested Chain Rule",
        question_latex: `f(x) = \\frac{\\cos(${a}x^2)}{e^{${b}x}}`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' (top) and 'v' (bottom).", math: `u = \\cos(${a}x^2) \\quad v = e^{${b}x}` },
            { instruction: "2. Find u' (Watch out! Derivative of cos is negative, AND you need the Power Chain Rule for the inside!).", math: `u' = ${uPrime}` },
            { instruction: "3. Find v' (Exponential Chain Rule).", math: `v' = ${vPrime}` },
            { instruction: "4. Apply the Quotient Rule formula: (u'v - uv') / v^2.", math: `\\text{Formula: } \\frac{u'v - uv'}{v^2}` },
            { instruction: "5. Final structural answer:", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

// ==========================================
// 🎮 Core Game Loop
// ==========================================
function startRound() {
    hasAnswered = false;
    
    // Reset UI
    mcqContainer.innerHTML = '';
    actionButtons.style.display = 'none';
    stepsContainer.style.display = 'none';
    stepsContainer.innerHTML = '';
    upgradeBtn.style.display = 'none';

    // Route to the correct procedural engine
    if (currentLevel === 1) {
        if (currentStreak >= 3) {
            currentQuestion = generateLinearRule(); 
        } else {
            currentQuestion = generatePowerRule();  
        }
    } else if (currentLevel === 2) {
        if (currentStreak >= 3) {
            currentQuestion = generateTrigChainRule(); 
        } else {
            currentQuestion = generateChainRule();     
        }
    } else if (currentLevel === 3) {
        if (currentStreak === 3) {
            currentQuestion = generateProductChainBoss(); // Boss Stage 1
        } else if (currentStreak === 4) {
            currentQuestion = generateTranscendentalBoss(); // Boss Stage 2
        } else {
            currentQuestion = generateProductRule(); 
        }
    } else if (currentLevel === 4) {
        if (currentStreak >= 3) {
            currentQuestion = generateQuotientBoss(); 
        } else {
            currentQuestion = generateQuotientRule();     
        }
    }
    
    if (levelTitle) levelTitle.innerText = currentQuestion.title;

    // Render main question
    katex.render(currentQuestion.question_latex, mathContainer, { displayMode: true });
    
    // Render MCQ Buttons
    currentQuestion.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'mcq-btn';
        katex.render(choice.math, btn, { throwOnError: false });
        
        btn.onclick = () => {
            initializeAudio(); 
            handleAnswer(btn, choice.isCorrect);
        };
        mcqContainer.appendChild(btn);
    });
}

function handleAnswer(clickedBtn, isCorrect) {
    if (hasAnswered) return;
    hasAnswered = true;

    const allBtns = mcqContainer.querySelectorAll('.mcq-btn');
    allBtns.forEach((btn, index) => {
        btn.disabled = true;
        if (currentQuestion.choices[index].isCorrect) {
            btn.classList.add('correct');
        } else {
            btn.classList.add('wrong');
        }
    });

    actionButtons.style.display = 'flex';
    upgradeBtn.style.display = 'none';

    if (isCorrect) {
        yaySound.currentTime = 0;
        yaySound.play();

        currentStreak++;
        if (streakDisplay) streakDisplay.innerText = currentStreak;
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, zIndex: 9999 });
        
        showStepsBtn.style.display = 'none';
        
        // BUG FIX #2: Check for Boss Victories (3.75 replaces 3.5)
        if (currentQuestion.level === 1.5 || currentQuestion.level === 2.5 || currentQuestion.level === 3.75 || currentQuestion.level === 4.5) {
            
            if (currentQuestion.level === 1.5) {
                upgradeBtn.innerText = "🚀 Level Up: Unlock Chain Rule!";
            } else if (currentQuestion.level === 2.5) {
                upgradeBtn.innerText = "🚀 Level Up: Unlock Product Rule!";
            } else if (currentQuestion.level === 3.75) {
                upgradeBtn.innerText = "🚀 Level Up: Unlock Quotient Rule!";
            } else if (currentQuestion.level === 4.5) {
                upgradeBtn.innerText = "🏆 Victory! Claim Your Badge!";
            }

            upgradeBtn.style.display = 'block';
            nextQBtn.style.display = 'none';

        } else {
            nextQBtn.style.display = 'block';
        }
    } else {
        wrongSound.currentTime = 0;
        wrongSound.play();

        currentStreak = 0;
        if (streakDisplay) streakDisplay.innerText = currentStreak;
        
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

// ==========================================
// 🚀 Event Listeners & Baseline Hooks
// ==========================================
if (nextQBtn) nextQBtn.addEventListener('click', startRound);
if (showStepsBtn) showStepsBtn.addEventListener('click', showSteps);

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
        if(yaySound) { yaySound.currentTime = 0; yaySound.play(); }

        // BUG FIX #3: Trigger Achievements safely OUTSIDE the answer checker
        if (currentQuestion.level === 1.5) {
            triggerAchievement('calc_power_boss', 50);
            currentLevel = 2;
        } else if (currentQuestion.level === 2.5) {
            triggerAchievement('calc_chain_boss', 50);
            currentLevel = 3; 
        } else if (currentQuestion.level === 3.75) {
            triggerAchievement('calc_product_boss', 50);
            currentLevel = 4;
        } else if (currentQuestion.level === 4.5) {
            triggerAchievement('calc_quotient_boss', 100);
            alert("🎉 Congratulations! You have conquered Calculus Junior!");
            currentLevel = 1; // Loops back to start
        }

        currentStreak = 0; 
        if (streakDisplay) streakDisplay.innerText = currentStreak;
        startRound();
    });
}

// BUG FIX #1: Prevent KaTeX from rendering in a hidden display:none container!
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container'); // Change if your wrapper uses a different ID

    if (startBtn && startScreen) {
        startBtn.addEventListener('click', () => {
            startScreen.style.display = 'none';
            if (gameContainer) gameContainer.style.display = 'block'; 
            initializeAudio();
            startRound(); // KaTeX runs safely now!
        });
    } else {
        // Fallback if the UI wrapper doesn't have a start screen
        startRound();
    }
});
