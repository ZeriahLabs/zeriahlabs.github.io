// Game State
let basketCount = 0;
const basketTarget = 5;
let currentAnswer = 0;

// DOM Elements
const visualMath = document.getElementById('visual-math');
const abstractMath = document.getElementById('abstract-math');
const choicesContainer = document.getElementById('choices-container');
const basketCountDisplay = document.getElementById('basket-count');

// NEW: Screens & Buttons
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');

// NEW: Start Button Event Listener
startBtn.addEventListener('click', () => {
  // Hide the start screen and show the game screen
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  // Reset the basket just in case they are playing a second time
  basketCount = 0;
  basketCountDisplay.textContent = basketCount;
  
  // Kick off the first round!
  startNewRound();
});

function startNewRound() {
  // Generate numbers for toddlers (1 to 4 to keep it simple)
  const num1 = Math.floor(Math.random() * 4) + 1;
  const num2 = Math.floor(Math.random() * 4) + 1;
  currentAnswer = num1 + num2;

  // Render Visuals (Bananas)
  const item = '🍌';
  const visual1 = item.repeat(num1);
  const visual2 = item.repeat(num2);
  visualMath.innerHTML = `<span class="animate-pop">${visual1}</span> <span style="color:var(--brand)">+</span> <span class="animate-pop">${visual2}</span>`;

  // Render Abstract Math
  abstractMath.innerHTML = `${num1} + ${num2} = <span style="color:var(--brand2)">?</span>`;
  
  // Restart Animation
  abstractMath.classList.remove('animate-pop');
  void abstractMath.offsetWidth; 
  abstractMath.classList.add('animate-pop');

  // Generate 1 correct and 2 wrong answers
  let choices = [currentAnswer];
  while (choices.length < 3) {
    let wrongAnswer = currentAnswer + (Math.floor(Math.random() * 5) - 2);
    if (wrongAnswer > 0 && !choices.includes(wrongAnswer)) {
      choices.push(wrongAnswer);
    }
  }
  
  // Shuffle multiple choice buttons
  choices.sort(() => Math.random() - 0.5);

  // Render Buttons
  choicesContainer.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'math-btn animate-pop';
    btn.textContent = choice;
    btn.onclick = () => handleAnswer(choice);
    choicesContainer.appendChild(btn);
  });
}

async function handleAnswer(selectedChoice) {
  if (selectedChoice === currentAnswer) {
    basketCount++;
    basketCountDisplay.textContent = basketCount;
    
    // Tiny confetti for the correct answer
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, zIndex: 9999 });

    if (basketCount >= basketTarget) {
      await winBasket();
    } else {
      setTimeout(startNewRound, 600); 
    }
  } else {
    // Gentle shake animation for a wrong answer
    visualMath.style.transition = "transform 0.1s";
    visualMath.style.transform = "translateX(10px)";
    setTimeout(() => visualMath.style.transform = "translateX(-10px)", 100);
    setTimeout(() => visualMath.style.transform = "translateX(0)", 200);
  }
}

async function winBasket() {
  // BIG Celebration!
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, zIndex: 9999 });
  
  // NEW: Transition back to the start screen after a win
  setTimeout(() => {
    gameScreen.style.display = 'none';
    startScreen.style.display = 'block';
    
    // Change the start screen text to be encouraging
    document.querySelector('#start-screen h3').textContent = "Great job! Play again?";
  }, 3000); // Wait 3 seconds for them to enjoy the confetti

  // Talk to our new API!
  const token = localStorage.getItem('zeriah_token');
  if (token) {
    try {
      const response = await fetch('/api/unlock-achievement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': token 
        },
        body: JSON.stringify({
          achievementId: 'math_basket_filled',
          xpReward: 50
        })
      });

      if (response.ok) {
        if (typeof checkSession === 'function') {
            checkSession();
        }
      }
    } catch (error) {
      console.error("Failed to sync progress", error);
    }
  }
}

// Notice that we completely removed the auto-executing startNewRound() at the very bottom!
