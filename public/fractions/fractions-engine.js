// DOM Elements
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.getElementById('game-container');
const visualArea = document.getElementById('visual-area');
const questionText = document.getElementById('question-text');
const choicesArea = document.getElementById('choices-area');
const scoreDisplay = document.getElementById('score');

// Audio Setup
// Ensure these paths match your folder structure (add ../ if needed)
const bgm = new Audio('/sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3; // Keeps the BGM slightly quieter so it doesn't overpower sound effects

const sfxYay = new Audio('/sounds/yay.mp3');
const sfxWrong = new Audio('/sounds/wrong.mp3');

// Map these to your CSS variables for a cohesive look
const COLORS = {
    blue: '#00d0ff',    // Matches var(--brand)
    orange: '#a855f7',  // Matches var(--purple)
    line: '#eef6ff',    // Matches var(--ink) so lines show on dark bg
    cross: '#07101a',   // Cut-out look using your body background color
    empty: 'rgba(255, 255, 255, 0.05)' // Faint glass fill for empty slices
};

let score = 0;
let correctAnswer = "";

// Start Game Flow
startBtn.addEventListener('click', () => {
    // Hide start screen, show game
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    
    // Start background music
    bgm.play().catch(error => console.log("Audio blocked by browser:", error));
    
    // Generate the very first question
    generateQuestion();
});

function generateQuestion() {
    visualArea.innerHTML = '';
    choicesArea.innerHTML = '';

    // Randomize operation and denominator (between 3 and 10)
    const isAddition = Math.random() > 0.5;
    const denominator = Math.floor(Math.random() * 8) + 3; 
    
    let num1, num2, correctNum;

    if (isAddition) {
        // Allow going over 1 whole
        num1 = Math.floor(Math.random() * denominator) + 1;
        num2 = Math.floor(Math.random() * denominator) + 1;
        correctNum = num1 + num2;
        
        questionText.textContent = `${num1}/${denominator} + ${num2}/${denominator} = ?`;
        
        // Draw Pizza 1 (Blue)
        drawPizza(num1, denominator, COLORS.blue, 0);
        
        // Add "+" symbol
        const plus = document.createElement('div');
        plus.className = 'math-symbol';
        plus.textContent = '+';
        visualArea.appendChild(plus);
        
        // Draw Pizza 2 (Orange)
        drawPizza(num2, denominator, COLORS.orange, 0);

    } else {
        // Subtraction (capped at 1 whole max)
        
        // num1 is between 2 and the denominator (max 1 whole)
        num1 = Math.floor(Math.random() * (denominator - 1)) + 2; 
        
        // num2 is strictly less than num1 so we never hit 0 or negative
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1; 
        
        correctNum = num1 - num2;
        
        questionText.textContent = `${num1}/${denominator} - ${num2}/${denominator} = ?`;
        
        // Draw one pizza, coloring num1 slices, crossing out num2 slices
        drawPizza(num1, denominator, COLORS.blue, num2);
    }

    correctAnswer = `${correctNum}/${denominator}`;
    generateChoices(correctNum, denominator);
}

// Function to draw pizzas (handles numbers > 1 whole automatically)
function drawPizza(numerator, denominator, color, crossOutCount) {
    const pizzasNeeded = Math.max(1, Math.ceil(numerator / denominator));
    let remainingNumerator = numerator;
    
    for (let i = 0; i < pizzasNeeded; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        visualArea.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = 75;
        const sliceAngle = (2 * Math.PI) / denominator;

        // How many slices to color in this specific pizza
        const slicesToColor = Math.min(remainingNumerator, denominator);
        remainingNumerator -= slicesToColor;

        for (let j = 0; j < denominator; j++) {
            const startAngle = j * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();

            // Fill active slices with color, empty slices with faint glass
            if (j < slicesToColor) {
                ctx.fillStyle = color;
            } else {
                ctx.fillStyle = COLORS.empty; 
            }
            ctx.fill();

            if (j < slicesToColor) {
                const globalSliceIndex = (i * denominator) + j;
                const startIndexForCrosses = numerator - crossOutCount;

                if (globalSliceIndex >= startIndexForCrosses && globalSliceIndex < numerator) {
                    drawCross(ctx, cx, cy, radius, startAngle, endAngle);
                }
            }

            ctx.strokeStyle = COLORS.line;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Helper to draw a thick 'X' in the middle of a slice
function drawCross(ctx, cx, cy, radius, startAngle, endAngle) {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const dist = radius * 0.65; // Position the X 65% of the way to the edge
    
    const x = cx + Math.cos(midAngle) * dist;
    const y = cy + Math.sin(midAngle) * dist;
    const crossSize = 12;

    ctx.beginPath();
    // Top-left to bottom-right
    ctx.moveTo(x - crossSize, y - crossSize);
    ctx.lineTo(x + crossSize, y + crossSize);
    // Top-right to bottom-left
    ctx.moveTo(x + crossSize, y - crossSize);
    ctx.lineTo(x - crossSize, y + crossSize);
    
    ctx.strokeStyle = COLORS.cross;
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.stroke();
}

function generateChoices(correctNum, denominator) {
    // Generate 3 choices (1 correct, 2 slightly off)
    const choices = new Set([correctNum]);
    
    while (choices.size < 3) {
        // Generate a random offset for wrong answers (-2, -1, +1, or +2)
        const offset = Math.floor(Math.random() * 5) - 2;
        if (offset !== 0 && correctNum + offset >= 0) {
            choices.add(correctNum + offset);
        }
    }

    // Shuffle and render buttons
    Array.from(choices)
        .sort(() => Math.random() - 0.5)
        .forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = `${num}/${denominator}`;
            btn.onclick = () => handleChoice(`${num}/${denominator}`);
            choicesArea.appendChild(btn);
        });
}

function handleChoice(selected) {
    if (selected === correctAnswer) {
        // Resetting currentTime to 0 allows rapid consecutive clicks to play properly
        sfxYay.currentTime = 0;
        sfxYay.play();
        
        score += 10;
        scoreDisplay.textContent = score;
        generateQuestion();
    } else {
        sfxWrong.currentTime = 0;
        sfxWrong.play();
        
        // Simple visual feedback for wrong answer
        visualArea.style.opacity = '0.5';
        setTimeout(() => visualArea.style.opacity = '1', 300);
    }
}
