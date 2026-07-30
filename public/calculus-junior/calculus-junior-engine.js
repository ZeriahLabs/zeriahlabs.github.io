/* ============================================================================= 
ZERIAH LABS ENGINE: Calculus Junior (MCQ Edition)
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

// Helper: Shuffle Array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 1. Procedural Engine with Plausible Distractors
function generatePowerRule() {
    const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const b = Math.floor(Math.random() * 4) + 2; // 2 to 5
    
    const correctAnswer = `${a * b}x^{${b - 1}}`;
    
    // Generate common mistakes for distractors
    const wrong1 = `${a * b}x^{${b}}`;       // Forgot to subtract 1
    const wrong2 = `${a * b}x^{${b + 1}}`;   // Added 1 instead of subtracting
    const wrong3 = `${b}x^{${b - 1}}`;       // Forgot to multiply by coefficient 'a'
    
    let choices = [
        { math: correctAnswer, isCorrect: true },
        { math: wrong1, isCorrect: false },
        { math: wrong2, isCorrect: false },
        { math: wrong3, isCorrect: false }
    ];

    return {
        level: 1,
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

// 2. The Game Loop
function startRound() {
    hasAnswered = false;
    
    // Reset UI
    mcqContainer.innerHTML = '';
    actionButtons.style.display = 'none';
    stepsContainer.style.display = 'none';
    stepsContainer.innerHTML = '';
    upgradeBtn.style.display = 'none';

    // Generate new data
    currentQuestion = generatePowerRule();

    // Render main question
    katex.render(currentQuestion.question_latex, mathContainer, { displayMode: true });
    
    // Render MCQ Buttons
    currentQuestion.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'mcq-btn';
        // Render KaTeX directly inside the button!
        katex.render(choice.math, btn, { throwOnError: false });
        
        btn.onclick = () => handleAnswer(btn, choice.isCorrect);
        mcqContainer.appendChild(btn);
    });
}

// 3. Answer Checking Logic
function handleAnswer(clickedBtn, isCorrect) {
    if (hasAnswered) return; // Prevent multiple clicks
    hasAnswered = true;

    // Disable all buttons and reveal the right answer
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
    } else {
        currentStreak = 0;
        streakDisplay.innerText = currentStreak;
        // Optional: play a soft 'bonk' sound here
    }

    // Show Post-Answer Actions
    actionButtons.style.display = 'flex';
    
    // If they are on a hot streak, show the Upgrade button!
    if (currentStreak >= 3) {
        upgradeBtn.style.display = 'block';
    }
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
    
    // Hide the show steps button once it's clicked
    showStepsBtn.style.display = 'none';
}

// Event Listeners
nextQBtn.addEventListener('click', startRound);
showStepsBtn.addEventListener('click', showSteps);
upgradeBtn.addEventListener('click', () => {
    alert("🚀 Zeriah Labs Backend Hook: Update D1 Database to Level 2 (Chain Rule) and load new templates!");
    // In production, this would trigger an achievement and load generateChainRule()
});

// Start the first round when everything loads
window.onload = startRound;
