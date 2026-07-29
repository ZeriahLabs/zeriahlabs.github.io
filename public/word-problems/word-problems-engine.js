/* ============================================================================= 
ZERIAH LABS ENGINE: Procedural Math Word Problems
============================================================================= 
*/

const CSV_URL = 'https://assets.zeriahlabs.com/word-problems/word-problems-generator.csv?v=1';

// --- AUDIO SETUP ---
const bgm = new Audio('/sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.2; // Keep it soft in the background
let bgmStarted = false;

const sfxYay = new Audio('/sounds/yay.mp3');
const sfxWrong = new Audio('/sounds/wrong.mp3');

let names = [];
let objects = [];
let actions = [];
let currentProblemText = "";
let isDataLoaded = false;

// --- 1. FETCH AND PARSE THE CSV ---
async function initializeEngine() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();
        parseCSV(csvText);
        isDataLoaded = true;
        generateProblem(); 
    } catch (error) {
        console.error("Failed to load CSV:", error);
        document.getElementById('problem-text').innerText = "Error loading data.";
    }
}

function parseCSV(csvData) {
    const rows = csvData.split('\n').slice(1);
    rows.forEach(row => {
        const cleanRow = row.replace('\r', '');
        const cols = cleanRow.split(',');
        if (cols[0] && cols[1]) names.push({ name: cols[0], gender: cols[1] });
        if (cols[2] && cols[3] && cols[4]) objects.push({ item: cols[2], emojiUrl: cols[3], objClass: cols[4] });
        if (cols[5] && cols[6] && cols[7]) actions.push({ actClass: cols[5], verb: cols[6], operator: cols[7], preposition: cols[8] || '' });
    });
}

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- 2. ENGINE LOGIC ---
function generateProblem() {
    if (!isDataLoaded) return;

    // Pick Variables
    const selectedObj = getRandom(objects);
    const validActions = actions.filter(a => a.actClass === selectedObj.objClass);
    const selectedAction = validActions.length > 0 ? getRandom(validActions) : actions[0];
    const person1 = getRandom(names);
    let person2 = getRandom(names);
    while(person1.name === person2.name) { person2 = getRandom(names); }
    const pronoun = person1.gender === 'm' ? 'He' : 'She';

    // Generate Numbers (Fixed to prevent '1' for plurals)
    const num1 = Math.floor(Math.random() * 7) + 6; // 6 to 12
    const num2 = Math.floor(Math.random() * 4) + 2; // 2 to 5

    // Construct the Sentence
    let sentence = `${person1.name} has ${num1} ${selectedObj.item}. `;
    if (selectedAction.preposition !== '') {
        sentence += `${pronoun} ${selectedAction.verb} ${num2} ${selectedObj.item} ${selectedAction.preposition} ${person2.name}. `;
    } else {
        sentence += `${pronoun} ${selectedAction.verb} ${num2} of them. `;
    }
    if (selectedAction.operator === '+') {
        sentence += `How many ${selectedObj.item} does ${person1.name} have in total?`;
    } else {
        sentence += `How many ${selectedObj.item} does ${person1.name} have left?`;
    }
    currentProblemText = sentence;

    // Determine Correct Answer
    const correctAnswer = selectedAction.operator === '+' ? num1 + num2 : num1 - num2;

    // --- 3. UPDATE THE DOM ---
    document.getElementById('problem-text').innerText = sentence;

    const visualContainer = document.getElementById('visual-container');
    const imgTag = `<img src="${selectedObj.emojiUrl}" class="emoji-img">`;
    visualContainer.innerHTML = `${num1} ${imgTag} ${selectedAction.operator} ${num2} ${imgTag}`;

    document.getElementById('math-container').style.display = 'inline-block';
    document.getElementById('math-num1').innerText = num1;
    document.getElementById('math-op').innerText = selectedAction.operator;
    document.getElementById('math-num2').innerText = num2;
    document.getElementById('math-ans').innerText = "?"; // Hide answer initially

    // Generate Multiple Choice Buttons
    generateAnswerButtons(correctAnswer);
}

// --- 4. MULTIPLE CHOICE LOGIC ---
function generateAnswerButtons(correctAnswer) {
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = ''; // Clear old buttons
    answersContainer.style.display = 'flex';

    // Create 3 options: Correct, +1, and -1
    let options = [correctAnswer, correctAnswer + 1, correctAnswer - 1];
    
    // Shuffle the options array so the correct answer isn't always first
    options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'ans-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, correctAnswer);
        answersContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct) {
    // Start BGM on first interaction (Browsers block autoplay until user clicks)
    if (!bgmStarted) {
        bgm.play();
        bgmStarted = true;
    }

    if (selected === correct) {
        sfxYay.play();
        document.getElementById('math-ans').innerText = correct; // Reveal the answer!
        document.getElementById('answers-container').style.display = 'none'; // Hide buttons
        
        // Eventually, you can ping your triggerAchievement() function here!
    } else {
        sfxWrong.play();
    }
}

// --- 5. TEXT-TO-SPEECH ---
function readQuestion() {
    if (!currentProblemText) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(currentProblemText);
    utterance.rate = 0.9; 
    utterance.pitch = 1.1; 
    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded
window.speechSynthesis.onvoiceschanged = () => {};

// --- 6. EVENT LISTENERS ---
document.getElementById('generate-btn').addEventListener('click', generateProblem);
document.getElementById('read-btn').addEventListener('click', readQuestion);

window.onload = initializeEngine;
