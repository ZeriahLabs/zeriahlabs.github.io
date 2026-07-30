/* ============================================================================= 
ZERIAH LABS ENGINE: Calculus Junior (MCQ + Boss Stage Edition)
============================================================================= 
*/

let currentQuestion = null;
let currentStreak = 0;
let hasAnswered = false;

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

// NEW HELPER: Formats terms cleanly so x^1 becomes x, and x^0 becomes just the number
function formatTerm(coeff, exponent) {
    if (exponent === 1) return `${coeff}x`;
    if (exponent === 0) return `${coeff}`; // Safety catch
    return `${coeff}x^{${exponent}}`;
}

// 1A. Standard Procedural Engine (Updated with Formatter)
function generatePowerRule() {
    const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const b = Math.floor(Math.random() * 4) + 2; // 2 to 5
    
    // Pass the math through our new formatter!
    const correctAnswer = formatTerm(a * b, b - 1);
    
    // Distractors
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

// 1B. The "Boss Stage" Engine (The Invisible Exponent)
function generateLinearRule() {
    const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
    
    const correctAnswer = `${a}`; // The x drops entirely
    
    // Plausible mistakes for ax
    const wrong1 = `${a}x`; // Forgot to drop the x entirely
    const wrong2 = `x`;     // Dropped the coefficient instead
    const wrong3 = `0`;     // Confused it with a constant
    
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

// 2. The Game Loop
function startRound() {
    hasAnswered = false;
    
    // Reset UI
    mcqContainer.innerHTML = '';
    actionButtons.style.display = 'none';
    stepsContainer.style.display = 'none';
    stepsContainer.innerHTML = '';
    upgradeBtn.style.display = 'none';

    // Boss Stage Logic!
    if (currentStreak >= 3) {
        currentQuestion = generateLinearRule();
    } else {
        currentQuestion = generatePowerRule();
    }
    
    levelTitle.innerText = currentQuestion.title;

    // Render main question
    katex.render(currentQuestion.question_latex, mathContainer, { displayMode: true });
    
    // Render MCQ Buttons
    currentQuestion.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'mcq-btn';
        katex.render(choice.math, btn, { throwOnError: false });
        
        btn.onclick = () => handleAnswer(btn, choice.isCorrect);
        mcqContainer.appendChild(btn);
    });
}

// 3. Answer Checking Logic
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

    if (isCorrect) {
        currentStreak++;
        streakDisplay.innerText = currentStreak;
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        
        // Show Upgrade Button only if they beat the boss!
        if (currentQuestion.level === 1.5) {
            upgradeBtn.style.display = 'block';
            nextQBtn.style.display = 'none'; // Hide next question to force upgrade or review
        } else {
            nextQBtn.style.display = 'block';
        }
    } else {
        currentStreak = 0;
        streakDisplay.innerText = currentStreak;
        nextQBtn.style.display = 'block';
    }

    actionButtons.style.display = 'flex';
}

// 4. Show Steps
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
    alert("🚀 Zeriah Labs Backend Hook: Moving to Level 2 (Chain Rule)!");
    // You would load generateChainRule() here
});

// Initialize
window.onload = startRound;
