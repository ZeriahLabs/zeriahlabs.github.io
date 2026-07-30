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

// 1E. Level 3: The Product Rule ✖️ (Now with Subtraction!)
function generateProductRule() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 5) + 1; 
    const c = Math.floor(Math.random() * 4) + 2; 
    const d = Math.floor(Math.random() * 5) + 1; 

    // 50/50 chance to be a plus or minus
    const sign1 = Math.random() > 0.5 ? '+' : '-';
    const sign2 = Math.random() > 0.5 ? '+' : '-';

    // The Left Piece (u) and Right Piece (v)
    const u = `${a}x^2 ${sign1} ${b}`;
    const uPrime = `${a * 2}x`;

    const v = `${c}x ${sign2} ${d}`;
    const vPrime = `${c}`;

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
        level: 3,
        title: "Level 3: Product Rule ✖️",
        concept: "Product Rule",
        question_latex: `f(x) = (${u})(${v})`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify your two main pieces: 'u' (the left part) and 'v' (the right part).", math: `u = ${u} \\quad v = ${v}` },
            { instruction: "2. Find the derivative of 'u' (u').", math: `u' = ${uPrime}` },
            { instruction: "3. Find the derivative of 'v' (v').", math: `v' = ${vPrime}` },
            { instruction: "4. Write out the Product Rule formula.", math: `\\text{Formula: } (u' \\cdot v) + (u \\cdot v')` },
            { instruction: "5. Plug your pieces into the formula to get the final structure!", math: `f'(x) = ${correctAnswer}` }
        ]
    };
}

// 1F. Level 3 Boss: Product & Chain Combo! 👾
function generateProductChainBoss() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 4) + 2; 

    const u = `${a}x^2`;
    const uPrime = `${a * 2}x`;
    
    const v = `\\sin(${b}x)`;
    const vPrime = `${b}\\cos(${b}x)`; // Chain rule applied!

    const correctAnswer = `(${uPrime})\\sin(${b}x) + (${u})(${vPrime})`;

    const wrong1 = `(${uPrime})(${vPrime})`; // Trap: Just multiplied them
    const wrong2 = `(${uPrime})\\sin(${b}x) + (${u})(\\cos(${b}x))`; // Trap: Forgot the inner derivative 'b' on the cosine
    const wrong3 = `(${uPrime})\\sin(${b}x) - (${u})(${vPrime})`; // Trap: Used subtraction

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 3.5,
        title: "Level 3 Boss: The Ultimate Combo! 🐉",
        concept: "Product + Chain Rule",
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

// 1G. Level 4: The Quotient Rule ➗
function generateQuotientRule() {
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 5) + 1; 
    const c = Math.floor(Math.random() * 4) + 2; 
    const d = Math.floor(Math.random() * 5) + 1; 

    // Randomize plus or minus for variety
    const sign1 = Math.random() > 0.5 ? '+' : '-';
    const sign2 = Math.random() > 0.5 ? '+' : '-';

    // Top Piece (u) and Bottom Piece (v)
    const u = `${a}x ${sign1} ${b}`;
    const uPrime = `${a}`;

    const v = `${c}x ${sign2} ${d}`;
    const vPrime = `${c}`;

    // The perfect structure: (u'v - uv') / v^2
    const numeratorCorrect = `(${uPrime})(${v}) - (${u})(${vPrime})`;
    const denomCorrect = `(${v})^2`;
    
    // Note: \frac{top}{bottom} is the KaTeX command for a fraction
    const correctAnswer = `\\frac{${numeratorCorrect}}{${denomCorrect}}`;

    // The Teacher's Traps!
    const wrong1 = `\\frac{(${uPrime})(${v}) + (${u})(${vPrime})}{${denomCorrect}}`; // Trap 1: Used a plus sign (Product Rule confusion)
    const wrong2 = `\\frac{(${u})(${vPrime}) - (${uPrime})(${v})}{${denomCorrect}}`; // Trap 2: Backwards numerator (uv' - u'v)
    const wrong3 = `\\frac{${numeratorCorrect}}{${v}}`;                            // Trap 3: Forgot to square the denominator

    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 4,
        title: "Level 4: Quotient Rule ➗",
        concept: "Quotient Rule",
        question_latex: `f(x) = \\frac{${u}}{${v}}`,
        choices: shuffle(choices),
        steps: [
            { instruction: "1. Identify 'u' (the top) and 'v' (the bottom).", math: `u = ${u} \\quad v = ${v}` },
            { instruction: "2. Find the derivative of the top (u').", math: `u' = ${uPrime}` },
            { instruction: "3. Find the derivative of the bottom (v').", math: `v' = ${vPrime}` },
            { instruction: "4. Write out the Quotient Rule formula.", math: `\\text{Formula: } \\frac{(u' \\cdot v) - (u \\cdot v')}{v^2}` },
            { instruction: "5. Plug your pieces into the formula. Order matters!", math: `f'(x) = ${correctAnswer}` }
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
        if (currentStreak >= 3) {
            currentQuestion = generateProductChainBoss(); 
        } else {
            currentQuestion = generateProductRule();     
        }
    } else if (currentLevel === 4) {
        currentQuestion = generateQuotientRule(); // <--- Level 4 unlocked!
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
            
            // --- THE FIX IS HERE ---
            // Add 3.5 to the boss check
            if (currentQuestion.level === 1.5 || currentQuestion.level === 2.5 || currentQuestion.level === 3.5) {
                
                if (currentQuestion.level === 1.5) {
                    upgradeBtn.innerText = "🚀 Level Up: Unlock Chain Rule!";
                } else if (currentQuestion.level === 2.5) {
                    upgradeBtn.innerText = "🚀 Level Up: Unlock Product Rule!";
                } else if (currentQuestion.level === 3.5) {
                    upgradeBtn.innerText = "🚀 Level Up: Unlock Quotient Rule!"; // <--- Add this!
                }
    
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

    // Level Progression Logic
    // Update the progression logic
    if (currentQuestion.level === 1.5) {
        currentLevel = 2;
    } else if (currentQuestion.level === 2.5) {
        currentLevel = 3; 
    } else if (currentQuestion.level === 3.5) {
        currentLevel = 4; // <--- Pushes to Level 4
    }

    currentStreak = 0; 
    streakDisplay.innerText = currentStreak;
    startRound();
});

// Initialize
window.onload = startRound;
