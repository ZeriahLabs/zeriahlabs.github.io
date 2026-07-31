// ZERIAH LABS ENGINE: Equation Defense
const ASSET_URL = "https://assets.zeriahlabs.com/microsoft-fluent-emoji/";

let towerStats = { hp: 100, maxHp: 100, attack: 10, fireRate: 1500 }; // fireRate in ms
let currentWave = 1;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Fits right into your baseline template
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Load your Fluent Emojis directly from your CDN
    this.load.image('tower', `${ASSET_URL}castle_3d.webp`);
    this.load.image('enemy1', `${ASSET_URL}alien_monster_3d.webp`);
    this.load.image('bullet', `${ASSET_URL}glowing_star_3d.webp`);
}

function create() {
    // Place Tower at the bottom center
    this.tower = this.physics.add.sprite(400, 550, 'tower').setScale(0.5);
    this.tower.setImmovable(true);
    
    // Group for enemies and bullets
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    // Physics Collisions
    this.physics.add.overlap(this.bullets, this.enemies, hitEnemy, null, this);
    this.physics.add.overlap(this.enemies, this.tower, hitTower, null, this);

    // Start auto-firing timer
    this.fireTimer = this.time.addEvent({
        delay: towerStats.fireRate,
        callback: fireBullet,
        callbackScope: this,
        loop: true
    });

    startWave(this);
}

function update() {
    // Enemy pathing logic - make them walk towards the tower (400, 550)
    this.enemies.getChildren().forEach(enemy => {
        this.physics.moveToObject(enemy, this.tower, 50); // 50 is speed
    });
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.hp -= towerStats.attack;
    
    if (enemy.hp <= 0) {
        enemy.destroy();
        // Trigger small confetti here!
    }
}

function triggerUpgradePhase() {
    // Pause the Phaser game
    game.scene.pause('default');
    
    // Show the Math UI
    document.getElementById('math-modal').style.display = 'block';
    
    if (currentWave % 5 === 0) {
        generateCalculusQuestion(); // Hard mode!
    } else {
        generateBasicMathQuestion(); // Standard
    }
}
