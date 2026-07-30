/* ============================================================================= 
ZERIAH LABS ENGINE: Progressive Calculus Trainer
============================================================================= 
*/

let currentQuestion = null;
let currentStreak = 0;

// DOM Elements
const mathContainer = document.getElementById('math-container');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const showStepsBtn = document.getElementById('show-steps-btn');
const stepsContainer = document.getElementById('steps-container');
const streakDisplay = document.getElementById('streak');

// 1. The Procedural "Math-Libs" Engine
function generatePowerRule() {
    // Pick random coefficient (a) and exponent (b)
    const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const b = Math.floor(Math.random() * 4) + 2; // 2 to 5
    
    const finalAnswer = `${a * b}x^${b - 1}`;
    
    // Return the full JSON schema containing the steps
    return {
        level: 1,
        concept: "Power Rule",
        question_latex: `f(x) = ${a}x^{${b}}`,
        final_answer: finalAnswer,
        steps: [
            {
                instruction: "1. Identify the coefficient and the exponent.",
                math: `a = ${a}, \\quad n = ${b}`
            },
            {
                instruction: "2. Multiply the exponent by the coefficient.",
                math: `${a} \\times ${b} = ${a * b}`
            },
            {
                instruction: "3. Subtract 1 from the original exponent.",
                math: `${b} - 1 = ${b - 1}`
            },
            {
                instruction: "4. Combine them for your final derivative.",
                math: `f'(x) = ${finalAnswer}`
            }
        ]
    };
}

// 2. The Game Loop
function startRound() {
    // Reset UI
    answerInput.value = '';
    answerInput.style.borderColor = '#475569';
    stepsContainer.style.display = 'none';
    stepsContainer.innerHTML = '';
    showStepsBtn.style.display = 'none';

    // Generate new data
    currentQuestion = generatePowerRule();

    // Render the question beautifully using KaTeX
    katex.render(currentQuestion.question_latex, mathContainer, {
        throwOnError: false,
        displayMode: true
    });
    
    answerInput.focus();
}

// 3. Answer Checking Logic
function checkAnswer() {
    // Clean up user input (remove spaces, standardize lowercase x)
    const userGuess = answerInput.value.replace(/\s+/g, '').toLowerCase();
    
    if (userGuess === currentQuestion.final_answer) {
        // Correct!
        answerInput.style.borderColor = '#34d399'; // Green
        currentStreak++;
        streakDisplay.innerText = currentStreak;
        
        if (currentStreak === 3) {
            triggerLevelUp();
        } else {
            // Little celebration and next round
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            setTimeout(startRound, 1200);
        }
    } else {
        // Wrong!
        answerInput.style.borderColor = '#ef4444'; // Red
        currentStreak = 0; // Reset streak
        streakDisplay.innerText = currentStreak;
        
        // Show the lifeline button
        showStepsBtn.style.display = 'inline-block';
        // Shake animation could go here
    }
}

// 4. The Step-by-Step Renderer
function showSteps() {
    showStepsBtn.style.display = 'none';
    stepsContainer.style.display = 'block';
    stepsContainer.innerHTML = '<h3>Step-by-Step Solution:</h3>';

    // Loop through our JSON array and render each step
    currentQuestion.steps.forEach((step, index) => {
        // Create the container with a staggered animation delay
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.style.animationDelay = `${index * 0.4}s`; 

        const instructionText = document.createElement('div');
        instructionText.className = 'step-instruction';
        instructionText.innerText = step.instruction;

        const mathRenderDiv = document.createElement('div');
        mathRenderDiv.className = 'step-math';
        
        // Render the math part via KaTeX
        katex.render(step.math, mathRenderDiv, { throwOnError: false });

        stepDiv.appendChild(instructionText);
        stepDiv.appendChild(mathRenderDiv);
        stepsContainer.appendChild(stepDiv);
    });

    // Provide a "Next Question" button after they read the steps
    setTimeout(() => {
        const nextBtn = document.createElement('button');
        nextBtn.innerText = "Got it! Next Question";
        nextBtn.style.marginTop = "20px";
        nextBtn.onclick = startRound;
        stepsContainer.appendChild(nextBtn);
    }, currentQuestion.steps.length * 400 + 500);
}

// 5. Zeriah Labs D1 Integration Placeholder
function triggerLevelUp() {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    
    // Note: This is where you would hook into your existing triggerAchievement() function
    // triggerAchievement('calculus_power_rule_master', 50);
    
    setTimeout(() => {
        alert("🎉 Achievement Unlocked! You've mastered the Power Rule! (In production, this moves you to Level 2: Chain Rule)");
        currentStreak = 0;
        streakDisplay.innerText = currentStreak;
        startRound();
    }, 2000);
}

// Event Listeners
submitBtn.addEventListener('click', checkAnswer);
showStepsBtn.addEventListener('click', showSteps);

answerInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') checkAnswer();
});

// Initialize the first game
startRound();
