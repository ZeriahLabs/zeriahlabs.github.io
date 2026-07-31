/* =============================================================================
ZERIAH LABS ENGINE: Equation Defense (V2 - Active Abilities & Animations)
============================================================================= */
const ASSET_URL = "https://assets.zeriahlabs.com/microsoft-fluent-emoji/";

// --- Game State ---
let towerStats = { hp: 100, maxHp: 100, attack: 10, baseFireRate: 1500, currentFireRate: 1500 }; 
let currentWave = 1;
let enemiesRemainingToSpawn = 0;
let activeEnemies = 0;
let isWaveActive = false;
let correctAnswer = 0;
let gameScene; 

// --- Ability Charges ---
let killsForHeal = 0;
let killsForSpeed = 0;
let nukeInventory = 0;
let isOverclocked = false; // Tracks if temporary speed boost is active

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload: preload, create: create, update: update },
    transparent: true 
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('tower', `${ASSET_URL}castle_3d.webp`);
    this.load.image('alien', `${ASSET_URL}alien_monster_3d.webp`);
    this.load.image('zombie', `${ASSET_URL}person_zombie_3d.webp`);
    this.load.image('ogre', `${ASSET_URL}ogre_3d.webp`);
    this.load.image('bullet', `${ASSET_URL}glowing_star_3d.webp`);
}

function create() {
    gameScene = this; 

    this.tower = this.physics.add.sprite(400, 550, 'tower').setScale(0.5);
    this.tower.setImmovable(true);
    
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.enemies, hitEnemy, null, this);
    this.physics.add.collider(this.enemies, this.tower, hitTower, null, this);

    this.fireTimer = this.time.addEvent({ delay: towerStats.currentFireRate, callback: fireBullet, callbackScope: this, loop: true });

    startWave();
}

function update() {
    if (!isWaveActive) return;
    this.enemies.getChildren().forEach(enemy => {
        this.physics.moveToObject(enemy, this.tower, enemy.speedData); 
    });
}

// ==========================================
// SPAWNING & ENEMY TYPES
// ==========================================
function startWave() {
    isWaveActive = true;
    updateUI();
    
    // Boss Wave!
    if (currentWave % 5 === 0) {
        enemiesRemainingToSpawn = 1; // Just 1 giant boss
        activeEnemies = 1;
        gameScene.time.addEvent({ delay: 1000, callback: spawnOgreBoss, callbackScope: gameScene });
    } else {
        enemiesRemainingToSpawn = 5 + (currentWave * 2); 
        activeEnemies = enemiesRemainingToSpawn;
        gameScene.time.addEvent({
            delay: Math.max(500, 1500 - (currentWave * 50)), 
            callback: spawnRandomEnemy,
            callbackScope: gameScene,
            repeat: enemiesRemainingToSpawn - 1
        });
    }
}

function spawnRandomEnemy() {
    let randomX = Phaser.Math.Between(50, 750);
    // 30% chance for a Zombie, 70% chance for Alien
    let isZombie = Math.random() < 0.3;
    
    let enemy = gameScene.enemies.create(randomX, -50, isZombie ? 'zombie' : 'alien').setScale(0.4);
    
    if (isZombie) {
        enemy.hp = 40 + (currentWave * 8); 
        enemy.speedData = 30 + (currentWave * 2); // Slower
        // TWEEN: Wobble the zombie back and forth
        gameScene.tweens.add({ targets: enemy, angle: {from: -15, to: 15}, duration: 400, yoyo: true, repeat: -1 });
    } else {
        enemy.hp = 20 + (currentWave * 5); 
        enemy.speedData = 50 + (currentWave * 4); // Faster
    }
    enemiesRemainingToSpawn--; 
}

function spawnOgreBoss() {
    let enemy = gameScene.enemies.create(400, -100, 'ogre').setScale(0.8);
    enemy.hp = 200 * currentWave; // Massive HP
    enemy.speedData = 20; // Very slow
    // TWEEN: Menacing pulse
    gameScene.tweens.add({ targets: enemy, scaleX: 0.9, scaleY: 0.9, duration: 800, yoyo: true, repeat: -1 });
    enemiesRemainingToSpawn--;
}

function fireBullet() {
    if (!isWaveActive || gameScene.enemies.getChildren().length === 0) return;
    let closestEnemy = gameScene.physics.closest(gameScene.tower, gameScene.enemies.getChildren());
    
    if (closestEnemy) {
        let bullet = gameScene.bullets.create(gameScene.tower.x, gameScene.tower.y, 'bullet').setScale(0.25);
        gameScene.physics.moveToObject(bullet, closestEnemy, 400); 
        
        // TWEEN: Make the star spin rapidly while flying!
        gameScene.tweens.add({ targets: bullet, angle: 360, duration: 400, repeat: -1 });
    }
}

// ==========================================
// COMBAT & ABILITIES LOGIC
// ==========================================
function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.hp -= towerStats.attack;
    
    if (enemy.hp <= 0) {
        enemy.destroy();
        activeEnemies--;
        
        // Add to ability charges
        killsForHeal = Math.min(10, killsForHeal + 1);
        killsForSpeed = Math.min(15, killsForSpeed + 1);
        updateUI();

        if (activeEnemies <= 0 && enemiesRemainingToSpawn <= 0) triggerUpgradePhase();
    }
}

function hitTower(tower, enemy) {
    enemy.destroy();
    activeEnemies--;
    towerStats.hp -= 20;
    updateUI();
    if (towerStats.hp <= 0) alert("GAME OVER! The Core has been breached.");
    else if (activeEnemies <= 0 && enemiesRemainingToSpawn <= 0) triggerUpgradePhase();
}

// HTML Button Hooks
window.activateHeal = function() {
    if (killsForHeal >= 10) {
        towerStats.hp = Math.min(towerStats.maxHp, towerStats.hp + 50);
        killsForHeal = 0;
        updateUI();
    }
};

window.activateSpeed = function() {
    if (killsForSpeed >= 15 && !isOverclocked) {
        killsForSpeed = 0;
        isOverclocked = true;
        
        // Double firing speed
        gameScene.fireTimer.delay = towerStats.baseFireRate / 2;
        updateUI();

        // Revert back after 7 seconds
        setTimeout(() => {
            isOverclocked = false;
            gameScene.fireTimer.delay = towerStats.baseFireRate;
        }, 7000);
    }
};

window.activateNuke = function() {
    if (nukeInventory > 0) {
        nukeInventory--;
        updateUI();
        
        // Visual flash (Screen Clear)
        let flash = gameScene.add.rectangle(400, 300, 800, 600, 0xffffff).setAlpha(0);
        gameScene.tweens.add({ targets: flash, alpha: 1, yoyo: true, duration: 200, onComplete: () => flash.destroy() });

        // Destroy all enemies on screen
        gameScene.enemies.getChildren().forEach(enemy => {
            enemy.destroy();
            activeEnemies--;
        });
        
        if (activeEnemies <= 0 && enemiesRemainingToSpawn <= 0) triggerUpgradePhase();
    }
};

function updateUI() {
    document.getElementById('ui-wave').innerText = currentWave;
    document.getElementById('ui-hp').innerText = Math.max(0, towerStats.hp) + " / " + towerStats.maxHp;
    document.getElementById('ui-firerate').innerText = isOverclocked ? "OVERCLOCKED!" : (towerStats.baseFireRate / 1000).toFixed(1) + "s";

    // Manage Buttons
    let btnHeal = document.getElementById('btn-heal');
    document.getElementById('charge-heal').innerText = killsForHeal + " / 10";
    if (killsForHeal >= 10) { btnHeal.disabled = false; btnHeal.classList.add('ready'); } 
    else { btnHeal.disabled = true; btnHeal.classList.remove('ready'); }

    let btnSpeed = document.getElementById('btn-speed');
    document.getElementById('charge-speed').innerText = killsForSpeed + " / 15";
    if (killsForSpeed >= 15 && !isOverclocked) { btnSpeed.disabled = false; btnSpeed.classList.add('ready'); } 
    else { btnSpeed.disabled = true; btnSpeed.classList.remove('ready'); }

    let btnNuke = document.getElementById('btn-nuke');
    document.getElementById('charge-nuke').innerText = nukeInventory;
    if (nukeInventory > 0) { btnNuke.disabled = false; btnNuke.classList.add('ready'); } 
    else { btnNuke.disabled = true; btnNuke.classList.remove('ready'); }
}

// ==========================================
// MATH UPGRADE INTEGRATION
// ==========================================
function triggerUpgradePhase() {
    isWaveActive = false;
    gameScene.scene.pause('default'); 
    document.getElementById('math-modal').style.display = 'flex';
    document.getElementById('choices-container').style.display = 'grid';
    document.getElementById('upgrade-options').style.display = 'none';
    
    if (currentWave % 5 === 0) generateCalculusQuestion();
    else generateBasicMathQuestion();
}

function generateBasicMathQuestion() {
    const num1 = Phaser.Math.Between(1, 12);
    const num2 = Phaser.Math.Between(1, 12);
    correctAnswer = num1 * num2; 
    document.getElementById('math-question').innerHTML = `${num1} × ${num2} = ?`;
    renderChoices(correctAnswer);
}

function generateCalculusQuestion() {
    document.getElementById('modal-title').innerText = "BOSS DEFEATED!";
    correctAnswer = 6;
    const equationStr = "\\text{If } y = 3x^2, \\text{ find } \\frac{dy}{dx} \\text{ when } x = 1";
    document.getElementById('math-question').innerHTML = katex.renderToString(equationStr, { throwOnError: false });
    renderChoices(correctAnswer);
}

function renderChoices(correct) {
    let choices = [correct, correct + 2, correct - 1, correct + 5];
    Phaser.Utils.Array.Shuffle(choices); 
    const container = document.getElementById('choices-container');
    container.innerHTML = ''; 
    choices.forEach(choice => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice;
        btn.onclick = () => checkAnswer(choice);
        container.appendChild(btn);
    });
}

window.checkAnswer = function(selectedAnswer) {
    if (selectedAnswer === correctAnswer) {
        document.getElementById('choices-container').style.display = 'none';
        let optionsHtml = '';

        if (currentWave % 5 === 0) {
            // Boss Wave always gives a Nuke
            optionsHtml = `<button class="upgrade-btn" onclick="applyUpgrade('nuke')">+1 TACTICAL NUKE</button>`;
        } else {
            // Standard Upgrades (With 10% chance for Nuke)
            optionsHtml += `<button class="upgrade-btn" onclick="applyUpgrade('attack')">+5 Attack Damage</button>`;
            optionsHtml += `<button class="upgrade-btn" onclick="applyUpgrade('firerate')">-0.2s Firing Cooldown</button>`;
            if (Math.random() < 0.10) {
                optionsHtml += `<button class="upgrade-btn" style="background:var(--danger)" onclick="applyUpgrade('nuke')">LUCKY! +1 Nuke</button>`;
            }
        }
        
        document.getElementById('upgrade-options').innerHTML = `<h4 style="color: var(--brand2); font-size: 1.5rem;">System Overclocked! Choose an Upgrade:</h4>` + optionsHtml;
        document.getElementById('upgrade-options').style.display = 'block';
    } else {
        alert("Incorrect! Defenses compromised. Resuming wave...");
        closeModalAndNextWave();
    }
};

window.applyUpgrade = function(type) {
    if (type === 'attack') towerStats.attack += 5;
    else if (type === 'firerate') {
        towerStats.baseFireRate = Math.max(300, towerStats.baseFireRate - 200); 
        if (!isOverclocked) gameScene.fireTimer.delay = towerStats.baseFireRate;
    } 
    else if (type === 'nuke') nukeInventory++;
    
    updateUI();
    closeModalAndNextWave();
};

function closeModalAndNextWave() {
    document.getElementById('math-modal').style.display = 'none';
    document.getElementById('modal-title').innerText = "Wave Complete!";
    document.getElementById('modal-title').style.color = "var(--brand)";
    
    currentWave++;
    gameScene.scene.resume('default');
    startWave();
}
