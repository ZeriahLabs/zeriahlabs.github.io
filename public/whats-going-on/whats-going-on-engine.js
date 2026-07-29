// --- 1. SETUP AUDIO ---
// Moving up one folder (../) to access the public/sounds folder
const sndCorrect = new Audio('../sounds/yay.mp3');
const sndWrong = new Audio('../sounds/wrong.mp3');
const bgm = new Audio('../sounds/bgm.mp3');

// Configure Background Music
bgm.loop = true;      // Make it loop forever
bgm.volume = 0.2;     // Keep it at 20% volume so it's pleasant background noise

// --- 2. GAME DATA ---
const CSV_URL = 'https://assets.zeriahlabs.com/whats-going-on/whats_going_on.csv';
let gameDatabase = {}; 
let imageList = [];
let unplayedImages = []; // <--- ADD THIS NEW LINE
let currentQuestions = [];
let currentQuestionIndex = 0;

// Helper function: Parses CSV safely, ignoring commas inside quotation marks
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes; 
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Fetches the CSV from R2 and structures it
async function initGame() {
    const btn = document.getElementById('start-btn');
    btn.innerText = "Downloading Assets...";
    btn.disabled = true;

    // START BGM HERE: The user just clicked the button, so the browser allows audio!
    bgm.play().catch(e => console.log("Audio play prevented by browser:", e));

    try {
        // Cache-buster appended to bypass old CORS blocks
        const response = await fetch(CSV_URL + '?v=' + new Date().getTime());
        const csvText = await response.text();
        
        // Parse CSV data
        const rows = csvText.trim().split('\n').slice(1); 
        rows.forEach(row => {
            if (!row.trim()) return;
            
            const [img, question, opt0, opt1, opt2, correct] = parseCSVRow(row);
            
            if (!gameDatabase[img]) {
                gameDatabase[img] = [];
                imageList.push(img);
            }
            
            gameDatabase[img].push({
                question: question,
                options: [opt0, opt1, opt2],
                correct: parseInt(correct)
            });
        });

        document.getElementById('start-screen').style.display = 'none';
        startRound();
        
    } catch (error) {
        console.error("Failed to load game data:", error);
        btn.innerText = "Network Error!";
    }
}

// Starts the 2-second prep phase, then the 7-second observation phase
function startRound() {
    // --- NEW DECK OF CARDS LOGIC ---
    // If the unplayed deck is empty, refill it with all available images
    if (unplayedImages.length === 0) {
        unplayedImages = [...imageList]; 
    }
    
    // Pick a random index from the UNPLAYED deck
    const randomIndex = Math.floor(Math.random() * unplayedImages.length);
    const randomImage = unplayedImages[randomIndex];
    
    // Remove that specific image from the unplayed deck so it won't repeat
    unplayedImages.splice(randomIndex, 1);
    // ---------------------------------

    currentQuestions = gameDatabase[randomImage];
    currentQuestionIndex = 0;
    
    // Setup the image for observation
    const imgElement = document.getElementById('game-image');
    imgElement.src = randomImage; 
    
    // 1. THE PREP PHASE (Blurred & Dimmed)
    imgElement.style.filter = "brightness(30%) blur(8px)";
    document.getElementById('question-container').style.display = 'none';
    document.getElementById('prep-screen').style.display = 'flex'; // Show the warning
    
    // 2. WAIT 2 SECONDS, THEN REVEAL
    setTimeout(() => {
        
        // Hide the warning text
        document.getElementById('prep-screen').style.display = 'none';
        
        // Snap the picture into perfect clarity!
        imgElement.style.filter = "brightness(100%) blur(0px)";
        
        // 3. START THE 7-SECOND MEMORY TIMER
        setTimeout(() => {
            dimImageAndAsk();
        }, 7000);
        
    }, 2000);
}

// Dims the image and shows the first question
function dimImageAndAsk() {
    document.getElementById('game-image').style.filter = "brightness(25%) blur(4px)";
    showQuestion(currentQuestions[currentQuestionIndex]);
}

// Populates the UI with question data
function showQuestion(qData) {
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('question-text').innerText = qData.question;
    
    document.getElementById('opt-0').innerText = qData.options[0];
    document.getElementById('opt-1').innerText = qData.options[1];
    document.getElementById('opt-2').innerText = qData.options[2];
}

// Variables to track our game flow state
let isTransitioningImage = false;

// Validates the answer and calls the custom alert
function checkAnswer(selectedIndex) {
    const currentQ = currentQuestions[currentQuestionIndex];
    
    if (selectedIndex === currentQ.correct) {
        // Play correct sound
        sndCorrect.currentTime = 0; 
        sndCorrect.play();
        showCustomAlert("Correct! Great memory."); 
    } else {
        // Play wrong sound
        sndWrong.currentTime = 0; 
        sndWrong.play();
        showCustomAlert("Oops! The correct answer was:\n" + currentQ.options[currentQ.correct]);
    }
}

// Shows our fancy centered popup instead of the browser default
function showCustomAlert(message) {
    // Hide the question so the UI isn't cluttered
    document.getElementById('question-container').style.display = 'none';
    
    // Inject the message and show the box
    document.getElementById('custom-alert-text').innerText = message;
    document.getElementById('custom-alert').style.display = 'block';
}

// Triggered when the user clicks "Next" on our popup
function handleAlertClick() {
    // Hide the alert box
    document.getElementById('custom-alert').style.display = 'none';

    // Are we transitioning to a brand new picture?
    if (isTransitioningImage) {
        isTransitioningImage = false;
        startRound();
        return;
    }
    
    // Otherwise, move to the next question for the CURRENT image
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion(currentQuestions[currentQuestionIndex]);
    } else {
        // Out of questions for this picture, set up the transition state
        isTransitioningImage = true;
        showCustomAlert("Picture complete! Loading the next one...");
    }
}
