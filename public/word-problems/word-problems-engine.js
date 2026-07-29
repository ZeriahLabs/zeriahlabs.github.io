/* ============================================================================= 
ZERIAH LABS ENGINE: Procedural Math Word Problems
============================================================================= 
*/

const CSV_URL = 'https://assets.zeriahlabs.com/word-problems/word-problems-generator.csv?v=1';

let names = [];
let objects = [];
let actions = [];
let currentProblemText = "";
let isDataLoaded = false;

// --- 1. FETCH AND PARSE THE CSV ---
async function initializeEngine() {
    try {
        document.getElementById('problem-text').innerText = "Loading data from Zeriah Cloud...";
        
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const csvText = await response.text();
        parseCSV(csvText);
        
        isDataLoaded = true;
        generateProblem(); // Trigger the first problem once loaded
        
    } catch (error) {
        console.error("Failed to load CSV:", error);
        document.getElementById('problem-text').innerText = "Error loading data. Check console or CORS settings.";
    }
}

function parseCSV(csvData) {
    // Split by newlines, skip the header row
    const rows = csvData.split('\n').slice(1);

    rows.forEach(row => {
        // Handle carriage returns that might come from Windows Excel exports
        const cleanRow = row.replace('\r', '');
        const cols = cleanRow.split(',');
        
        // Populate Names (Columns 0 & 1)
        if (cols[0] && cols[1]) {
            names.push({ name: cols[0], gender: cols[1] });
        }
        // Populate Objects (Columns 2, 3, 4)
        if (cols[2] && cols[3] && cols[4]) {
            objects.push({ item: cols[2], emojiUrl: cols[3], objClass: cols[4] });
        }
        // Populate Actions (Columns 5, 6, 7, 8)
        if (cols[5] && cols[6] && cols[7]) {
            actions.push({ actClass: cols[5], verb: cols[6], operator: cols[7], preposition: cols[8] || '' });
        }
    });
}

// Helper for random picking
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- 2. ENGINE LOGIC ---
function generateProblem() {
    if (!isDataLoaded) return; // Prevent clicking before data loads

    // 1. Pick an Object
    const selectedObj = getRandom(objects);

    // 2. Filter Actions to match the Object's Class
    const validActions = actions.filter(a => a.actClass === selectedObj.objClass);
    
    // Fallback if no matching action is found in the limited dataset
    const selectedAction = validActions.length > 0 ? getRandom(validActions) : actions[0];

    // 3. Pick Names (Ensure they are different)
    const person1 = getRandom(names);
    let person2 = getRandom(names);
    while(person1.name === person2.name) {
        person2 = getRandom(names);
    }

    const pronoun = person1.gender === 'm' ? 'He' : 'She';

    // 4. Generate Numbers
    const num1 = Math.floor(Math.random() * 7) + 6; // 6 to 12
    const num2 = Math.floor(Math.random() * 5) + 1; // 1 to 5

    // 5. Construct the Sentence
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

    currentProblemText = sentence; // Save for voice

    // --- 3. UPDATE THE DOM ---
    
    // Update Text
    document.getElementById('problem-text').innerText = sentence;

    // Update Emojis
    const visualContainer = document.getElementById('visual-container');
    const imgTag = `<img src="${selectedObj.emojiUrl}" class="emoji-img">`;
    visualContainer.innerHTML = `
        ${num1} ${imgTag} 
        ${selectedAction.operator} 
        ${num2} ${imgTag}
    `;

    // Update MOE Math Stack
    document.getElementById('math-container').style.display = 'inline-block';
    document.getElementById('math-num1').innerText = num1;
    document.getElementById('math-op').innerText = selectedAction.operator;
    document.getElementById('math-num2').innerText = num2;
}

// --- 4. TEXT-TO-SPEECH ---
function readQuestion() {
    if (!currentProblemText) return;
    
    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(currentProblemText);
    utterance.rate = 0.9; 
    utterance.pitch = 1.1; 
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if(preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded (browser quirk)
window.speechSynthesis.onvoiceschanged = () => {};

// --- 5. EVENT LISTENERS ---
document.getElementById('generate-btn').addEventListener('click', generateProblem);
document.getElementById('read-btn').addEventListener('click', readQuestion);

// Kick off the fetch when the script loads
window.onload = initializeEngine;
