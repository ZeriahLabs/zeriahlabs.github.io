/* =============================================================================
ZERIAH LABS ENGINE: Equation Defense
=============================================================================
*/

const ASSET_URL = "https://assets.zeriahlabs.com/microsoft-fluent-emoji/";

// --- Game State ---
let towerStats = { hp: 100, maxHp: 100, attack: 20, fireRate: 1200 }; 
let currentWave = 1;
let enemiesRemainingToSpawn = 0;
let activeEnemies = 0;
let isWaveActive = false;
let correctAnswer = 0;
let gameScene; // Global reference to the Phaser scene

// --- Phaser Config ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    transparent: true // Lets your awesome CSS background glow through!
};

const game = new Phaser.Game(config);

// ==========================================
// 1. PHASER CORE SCENE
// ==========================================
function preload() {
    this.load.image('tower', `${ASSET_URL}castle_3d.webp`);
    this.load.image('enemy1', `${ASSET_URL}alien_monster_3d.webp`);
    this.load.image('bullet', `${ASSET_URL}glowing_star_3d.webp`);
}

function create() {
    gameScene = this; // Save reference for external HTML button clicks

    // Place Tower at the bottom center
    this.tower = this.physics.add.sprite(400, 550, 'tower').setScale(0.5);
    this.tower.setImmovable(true);
    
    // Groups
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, hitEnemy, null, this);
    this.physics.add.collider(this.enemies, this.tower, hitTower, null, this);

    // Auto-firing Timer
    this.fireTimer = this.time.addEvent({
        delay: towerStats.fireRate,
        callback: fireBullet,
        callbackScope: this,
        loop: true
    });

    // Start the first wave!
    startWave();
}

function update() {
    if (!isWaveActive) return;

    // Make enemies constantly move towards the tower
    this.enemies.getChildren().forEach(enemy => {
        this.physics.moveToObject(enemy, this.tower, 50 + (currentWave * 5)); // Get faster each wave
    });
}

// ==========================================
// 2. GAMEPLAY LOGIC
// ==========================================
function startWave() {
    isWaveActive = true;
    enemiesRemainingToSpawn = 5 + (currentWave * 2); // Waves get bigger
    activeEnemies = enemiesRemainingToSpawn;
    
    // Update UI
    document.getElementById('ui-wave').innerText = currentWave;

    // Spawn enemies on a staggered timer
    gameScene.time.addEvent({
        delay: Math.max(500, 1500 - (currentWave * 100)), // Spawn faster each wave
        callback: spawnEnemy,
        callbackScope: gameScene,
        repeat: enemiesRemainingToSpawn - 1
    });
}

function spawnEnemy() {
    let randomX = Phaser.Math.Between(50, 750);
    let enemy = gameScene.enemies.create(randomX, -50, 'enemy1').setScale(0.4);
    enemy.hp = 20 + (currentWave * 5); // Enemies get tougher
    
    // THE FIX: Tell the engine that one less enemy is waiting to spawn!
    enemiesRemainingToSpawn--; 
}

function fireBullet() {
    if (!isWaveActive || gameScene.enemies.getChildren().length === 0) return;

    // Find the closest enemy
    let closestEnemy = gameScene.physics.closest(gameScene.tower, gameScene.enemies.getChildren());
    
    if (closestEnemy) {
        let bullet = gameScene.bullets.create(gameScene.tower.x, gameScene.tower.y, 'bullet').setScale(0.25);
        gameScene.physics.moveToObject(bullet, closestEnemy, 400); // 400 is bullet speed
    }
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.hp -= towerStats.attack;
    
    if (enemy.hp <= 0) {
        enemy.destroy();
        activeEnemies--;
        
        // Wave Complete Check
        if (activeEnemies <= 0 && enemiesRemainingToSpawn <= 0) {
            triggerUpgradePhase();
        }
    }
}

function hitTower(tower, enemy) {
    enemy.destroy();
    activeEnemies--;
    
    towerStats.hp -= 15;
    document.getElementById('ui-hp').innerText = Math.max(0, towerStats.hp) + " / " + towerStats.maxHp;

    if (towerStats.hp <= 0) {
        isWaveActive = false;
        alert("GAME OVER! The Core has been breached.");
        // We will build a better game over screen later!
    } else if (activeEnemies <= 0 && enemiesRemainingToSpawn <= 0) {
        triggerUpgradePhase();
    }
}

// ==========================================
// 3. THE ZERIAH MATH INTEGRATION
// ==========================================
function triggerUpgradePhase() {
    isWaveActive = false;
    gameScene.scene.pause('default'); // Freeze the action
    
    document.getElementById('math-modal').style.display = 'flex';
    document.getElementById('choices-container').style.display = 'grid';
    document.getElementById('upgrade-options').style.display = 'none';
    
    if (currentWave % 5 === 0) {
        generateCalculusQuestion();
    } else {
        generateBasicMathQuestion();
    }
}

function generateBasicMathQuestion() {
    const num1 = Phaser.Math.Between(1, 12);
    const num2 = Phaser.Math.Between(1, 12);
    correctAnswer = num1 * num2; // Let's start with Multiplication
    
    document.getElementById('math-question').innerHTML = `${num1} × ${num2} = ?`;
    
    renderChoices(correctAnswer);
}

function generateCalculusQuestion() {
    document.getElementById('modal-title').innerText = "BOSS WAVE CLEARED!";
    document.getElementById('modal-title').style.color = "var(--danger)";
    
    // Hardcoded simple derivative for V1
    correctAnswer = 6;
    
    // Using KaTeX to render the math beautifully
    const equationStr = "\\text{If } y = 3x^2, \\text{ find } \\frac{dy}{dx} \\text{ when } x = 1";
    document.getElementById('math-question').innerHTML = katex.renderToString(equationStr, {
        throwOnError: false
    });
    
    renderChoices(correctAnswer);
}

function renderChoices(correct) {
    // Generate 3 wrong answers + 1 correct answer
    let choices = [correct, correct + 2, correct - 1, correct + 5];
    Phaser.Utils.Array.Shuffle(choices); // Randomize positions
    
    const container = document.getElementById('choices-container');
    container.innerHTML = ''; // Clear old buttons
    
    choices.forEach(choice => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice;
        btn.onclick = () => checkAnswer(choice);
        container.appendChild(btn);
    });
}

// ==========================================
// 4. HTML BUTTON HOOKS
// ==========================================
window.checkAnswer = function(selectedAnswer) {
    if (selectedAnswer === correctAnswer) {
        document.getElementById('choices-container').style.display = 'none';
        document.getElementById('upgrade-options').style.display = 'block';
        document.getElementById('math-question').innerHTML = "SYSTEM OVERCLOCKED! Choose your upgrade:";
    } else {
        // Punish wrong answer by forcing next wave with no upgrade!
        alert("Incorrect! Defenses compromised. Resuming wave...");
        closeModalAndNextWave();
    }
};

window.applyUpgrade = function(type) {
    if (type === 'hp') {
        towerStats.maxHp += 50;
        towerStats.hp = towerStats.maxHp; // Full heal
    } else if (type === 'attack') {
        towerStats.attack += 5;
    } else if (type === 'firerate') {
        towerStats.fireRate = Math.max(300, towerStats.fireRate - 200); // Faster shooting
        // Update the timer delay dynamically
        gameScene.fireTimer.delay = towerStats.fireRate; 
    }
    
    // Update UI Side Panel
    document.getElementById('ui-hp').innerText = towerStats.hp + " / " + towerStats.maxHp;
    document.getElementById('ui-attack').innerText = towerStats.attack;
    document.getElementById('ui-firerate').innerText = (towerStats.fireRate / 1000).toFixed(1) + "s";
    
    closeModalAndNextWave();
};

function closeModalAndNextWave() {
    document.getElementById('math-modal').style.display = 'none';
    
    // Reset Modal visual state for next time
    document.getElementById('modal-title').innerText = "Wave Complete!";
    document.getElementById('modal-title').style.color = "var(--brand)";
    
    currentWave++;
    gameScene.scene.resume('default');
    startWave();
}
