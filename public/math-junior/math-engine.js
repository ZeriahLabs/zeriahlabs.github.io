/*
  =============================================================================
  ZERIAH LABS ENGINE: Math Junior
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
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement API failed:", err);
    }
}

// ==========================================
// GAMEPLAY VARIABLES & LOGIC
// ==========================================
let basketCount = 0;
const basketTarget = 5;
let currentAnswer = 0;

// Track total correct answers across multiple baskets in one session
let sessionScore = 0; 
let sessionAchievements = new Set();

// Audio Setup (Using Absolute Paths per Baseline)
const bgMusic = new Audio('/sounds/bgm.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.2; 

const yaySound = new Audio('/sounds/yay.mp3');
const wrongSound = new Audio('/sounds/wrong.mp3');

// DOM Elements
const visualMath = document.getElementById('visual-math');
const abstractMath = document.getElementById('abstract-math');
const choicesContainer = document.getElementById('choices-container');
const basketCountDisplay = document.getElementById('basket-count');

// Screens & Buttons
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');

// Start Button Event Listener
startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  bgMusic.play().catch(e => console.log("Audio play failed:", e));
  
  basketCount = 0;
  basketCountDisplay.textContent = basketCount;
  
  startNewRound();
});

// Text-to-Speech Function
function speakEquation(num1, num2) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); 
    const speech = new SpeechSynthesisUtterance(`${num1} plus ${num2}, equals?`);
    speech.pitch = 1.2;
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  }
}

function startNewRound() {
  const num1 = Math.floor(Math.random() * 4) + 1;
  const num2 = Math.floor(Math.random() * 4) + 1;
  currentAnswer = num1 + num2;

  speakEquation(num1, num2);

  const item = '🍌'; // Using banana as the visual item
  const visual1 = item.repeat(num1);
  const visual2 = item.repeat(num2);
  visualMath.innerHTML = `<span class="animate-pop">${visual1}</span> <span style="color:var(--brand)">+</span> <span class="animate-pop">${visual2}</span>`;

  abstractMath.innerHTML = `${num1} + ${num2} = <span style="color:var(--brand2)">?</span>`;
  
  abstractMath.classList.remove('animate-pop');
  void abstractMath.offsetWidth; 
  abstractMath.classList.add('animate-pop');

  let choices = [currentAnswer];
  while (choices.length < 3) {
    let wrongAnswer = currentAnswer + (Math.floor(Math.random() * 5) - 2);
    if (wrongAnswer > 0 && !choices.includes(wrongAnswer)) {
      choices.push(wrongAnswer);
    }
  }
  
  choices.sort(() => Math.random() - 0.5);

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
    yaySound.currentTime = 0; 
    yaySound.play().catch(e => console.log(e));

    basketCount++;
    sessionScore++;
    basketCountDisplay.textContent = basketCount;
    
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, zIndex: 9999 });

    // ---------------------------------------------------------
    // ACHIEVEMENT TRIGGERS
    // ---------------------------------------------------------
    if (sessionScore === 5 && !sessionAchievements.has('math_basket')) {
        sessionAchievements.add('math_basket');
        triggerAchievement('math_basket', 50);
    }
    if (sessionScore === 15 && !sessionAchievements.has('math_scholar')) {
        sessionAchievements.add('math_scholar');
        triggerAchievement('math_scholar', 100);
    }
    if (sessionScore === 30 && !sessionAchievements.has('math_master')) {
        sessionAchievements.add('math_master');
        triggerAchievement('math_master', 200);
    }

    if (basketCount >= basketTarget) {
      await winBasket();
    } else {
      setTimeout(startNewRound, 1200); 
    }
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play().catch(e => console.log(e));

    visualMath.style.transition = "transform 0.1s";
    visualMath.style.transform = "translateX(10px)";
    setTimeout(() => visualMath.style.transform = "translateX(-10px)", 100);
    setTimeout(() => visualMath.style.transform = "translateX(0)", 200);
  }
}

async function winBasket() {
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, zIndex: 9999 });
  
  setTimeout(() => {
    gameScreen.style.display = 'none';
    startScreen.style.display = 'block';
    document.querySelector('#start-screen h3').textContent = "Great job! Play again?";
  }, 3000); 
}
