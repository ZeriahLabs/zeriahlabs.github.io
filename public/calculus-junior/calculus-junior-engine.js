/* ============================================================================= 
ZERIAH LABS ENGINE: Calculus Junior (Audio + Boss Stage Edition)
============================================================================= 
*/

let currentQuestion = null;
let currentStreak = 0;
let hasAnswered = false;
let currentLevel = 1; 

// ==========================================
// 🎵 Audio Engine (Updated Paths)
// ==========================================

// Use relative root paths so Cloudflare/GitHub maps them correctly
const bgm = new Audio('/sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3; 

const yaySound = new Audio('/sounds/yay.mp3');
yaySound.volume = 0.6;

const wrongSound = new Audio('/sounds/wrong.mp3');
wrongSound.volume = 0.5;

let bgmStarted = false;

// Helper to start BGM on first interaction (Browser Autoplay Policy Fix)
function initializeAudio() {
    if (!bgmStarted) {
        bgm.play().catch(e => console.log("BGM playback prevented by browser:", e));
        bgmStarted = true;
    }
}

// DOM Elements
const mathContainer = document.getElementById('math-container');
const mcqContainer = document.getElementById('mcq-container');
const actionButtons = document.getElementById('action-buttons');
const showStepsBtn = document.getElementById('show-steps-btn');
const nextQBtn = document.getElementById('next-q-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const stepsContainer = document.getElementById('steps-container');
const streakDisplay = document.getElementById('streak');
const levelTitle = document.getElementById('level-title');

// Helper: Shuffle Array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper: Formats terms cleanly
function formatTerm(coeff, exponent) {
    if (exponent === 1) return `${coeff}x`;
    if (exponent === 0) return `${coeff}`; 
    return `${coeff}x^{${exponent}}`;
}

// ==========================================
// ⚙️ Procedural Engines
// ==========================================

// 1A. Standard Power Rule
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
        level: 1,
        title: "Level 1: Power Rule",
        concept: "Power Rule",
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

// 1B. Level 1 Boss (Invisible Exponent)
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
        level: 1.5,
        title: "Level 1 Boss: The Invisible Exponent! 👾",
        concept: "Linear Power Rule",
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

// 1C. Level 2: Chain Rule
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
        level: 2,
        title: "Level 2: Chain Rule 🔗",
        concept: "Chain Rule",
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

// 1D. Level 2 Boss: Trig Chain Rule
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
        level: 2.5,
        title: "Level 2 Boss: The Sine Wave! 🌊",
        concept: "Trig Chain Rule",
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
    }
    
    levelTitle.innerText = currentQuestion.title;

    // Render main question
    katex.render(currentQuestion.question_latex, mathContainer, { displayMode: true });
    
    // Render MCQ Buttons
    currentQuestion.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'mcq-btn';
        katex.render(choice.math, btn, { throwOnError: false });
        
        btn.onclick = () => {
            initializeAudio(); // Start BGM on first interaction if needed
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
        // 🎵 Play Success Sound!
        yaySound.currentTime = 0;
        yaySound.play();

        currentStreak++;
        streakDisplay.innerText = currentStreak;
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        
        showStepsBtn.style.display = 'none';
        
        if (currentQuestion.level === 1.5 || currentQuestion.level === 2.5) {
            upgradeBtn.style.display = 'block';
            nextQBtn.style.display = 'none'; 
        } else {
            nextQBtn.style.display = 'block';
        }
    } else {
        // 🎵 Play Error Sound!
        wrongSound.currentTime = 0;
        wrongSound.play();

        currentStreak = 0;
        streakDisplay.innerText = currentStreak;
        
        showStepsBtn.style.display = 'block';
        nextQBtn.style.display = 'block';
    }
}

function showSteps() {
    stepsContainer.style.display = 'block';
    stepsContainer.innerHTML = '<h3>Step-by-Step Magic:</h3>';

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
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    yaySound.currentTime = 0;
    yaySound.play(); // Extra celebration for boss defeat!

    // Note: We need the logic for Level 3 here eventually
    currentLevel = 2; // Temporary: keep them on level 2 until level 3 is built
    if (currentQuestion.level === 1.5) {
        currentLevel = 2;
    } else if (currentQuestion.level === 2.5) {
        // currentLevel = 3; 
        alert("Level 3 coming soon!");
    }

    currentStreak = 0; 
    streakDisplay.innerText = currentStreak;
    startRound();
});

// Initialize
window.onload = startRound;
