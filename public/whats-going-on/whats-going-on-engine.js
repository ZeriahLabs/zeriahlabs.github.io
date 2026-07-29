const CSV_URL = 'https://assets.zeriahlabs.com/whats-going-on/whats_going_on.csv';
let gameDatabase = {}; 
let imageList = [];
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
            inQuotes = !inQuotes; // Toggle quote state
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

    try {
        const response = await fetch(CSV_URL + '?v=' + new Date().getTime());
        const csvText = await response.text();
        
        // Parse CSV data
        const rows = csvText.trim().split('\n').slice(1); // Skip the header row
        rows.forEach(row => {
            if (!row.trim()) return;
            
            const [img, question, opt0, opt1, opt2, correct] = parseCSVRow(row);
            
            // Group by the full R2 image URL
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

        // Hide start screen and kick off the game
        document.getElementById('start-screen').style.display = 'none';
        startRound();
        
    } catch (error) {
        console.error("Failed to load game data:", error);
        btn.innerText = "Network Error!";
    }
}

// Starts the 7-second observation phase
function startRound() {
    // Pick a random image category
    const randomImage = imageList[Math.floor(Math.random() * imageList.length)];
    
    currentQuestions = gameDatabase[randomImage];
    currentQuestionIndex = 0;
    
    // Setup the image for observation
    const imgElement = document.getElementById('game-image');
    imgElement.src = randomImage; 
    
    // Reset filters to fully visible
    imgElement.style.filter = "brightness(100%) blur(0px)";
    document.getElementById('question-container').style.display = 'none';
    
    // 7-Second Flash Timer
    setTimeout(() => {
        dimImageAndAsk();
    }, 7000);
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

// Validates the answer and progresses the loop
function checkAnswer(selectedIndex) {
    const currentQ = currentQuestions[currentQuestionIndex];
    
    if (selectedIndex === currentQ.correct) {
        // Here is where you can hook in your Cloudflare D1 Achievements!
        alert("Correct! Great memory."); 
    } else {
        alert("Oops! The correct answer was: " + currentQ.options[currentQ.correct]);
    }
    
    // Move to the next question for this image
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion(currentQuestions[currentQuestionIndex]);
    } else {
        // Out of questions for this picture, load a new one
        alert("You finished this picture! Loading the next one...");
        startRound();
    }
}
