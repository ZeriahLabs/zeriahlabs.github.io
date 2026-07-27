/*
  =============================================================================
  ZERIAH LABS ENGINE: Equation Defense
  =============================================================================
*/

// ==========================================
// CORE: Achievement API
// ==========================================
let sessionAchievements = new Set();

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
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        }
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement API failed:", err);
    }
}

// ==========================================
// INTERNAL AUDIO (Synthesized)
// ==========================================
const SoundFX = {
    ctx: null, isMuted: false,
    init: function() { 
        try { 
            const AC = window.AudioContext || window.webkitAudioContext; 
            if (!this.ctx && AC) this.ctx = new AC(); 
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); 
        } catch(e) {} 
    },
    playTone: function(freq, type, dur, vol = 0.05) {
        if (this.isMuted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(freq/2, this.ctx.currentTime + dur);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + dur);
        } catch (e) {}
    },
    playShoot: function() { this.playTone(300, 'triangle', 0.1, 0.05); },
    playExplosion: function() { this.playTone(100, 'sawtooth', 0.2, 0.1); },
    playError: function() { this.playTone(150, 'sawtooth', 0.5, 0.2); setTimeout(() => this.playTone(100, 'sawtooth', 0.5, 0.2), 100); }
};

// ==========================================
// GAME CONFIG & VARIABLES
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameActive = false;
let maxWaves = 10;
let currentWave = 1;
let waveTimer = 0;
const WAVE_DURATION = 450; 
let difficulty = 'normal';

let fireRate = 2.0; 
let lastFired = 0;
let spawnRate = 100;
let frameCount = 0;

let turret = { x: 100, y: 0, angle: 0, level: 1 };
let enemies = [];
let projectiles = [];
let particles = [];
let shockwaves = [];
let currentMathOptions = { left: {}, right: {} };

// Custom Resize to fit the board container, not the whole window
function resize() { 
    const board = document.querySelector('.equation-board');
    if(board) {
        canvas.width = board.clientWidth; 
        canvas.height = board.clientHeight; 
        turret.y = canvas.height / 2; 
    }
}
window.addEventListener('resize', resize);

// ==========================================
// EXPOSED HTML HOOKS
// ==========================================
window.selectDifficulty = function(level) {
    difficulty = level;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('btn-' + level).classList.add('selected');
}

window.startGame = function(waves) {
    SoundFX.init(); 
    resize();
    
    maxWaves = waves; currentWave = 1; waveTimer = 0; fireRate = 2.0; spawnRate = 80; frameCount = 0;
    
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('flex');
    document.getElementById('game-screen').classList.remove('hidden');
    
    document.getElementById('diff-display').innerText = "DIFFICULTY: " + difficulty.toUpperCase();
    
    gameActive = true;
    enemies = []; projectiles = []; particles = []; shockwaves = [];
    
    updateUI(); 
    animate();
}

window.chooseUpgrade = function(side) {
    const selected = side === 'left' ? currentMathOptions.left : currentMathOptions.right;
    const other = side === 'left' ? currentMathOptions.right : currentMathOptions.left;
    
    document.getElementById('upgrade-overlay').classList.add('hidden');
    document.getElementById('upgrade-overlay').classList.remove('flex');

    if (selected.raw < other.raw) {
        triggerPenalty();
        const pen = difficulty === 'professor' ? 6.0 : 3.0;
        fireRate = Math.max(1.0, fireRate - pen); 
    } else {
        fireRate += selected.boost;
    }

    // Example Milestone Triggers
    if (currentWave === 9 && !sessionAchievements.has('defense_rookie')) { 
        sessionAchievements.add('defense_rookie');
        triggerAchievement('defense_rookie', 100);
    }
    if (currentWave === 19 && !sessionAchievements.has('defense_veteran')) { 
        sessionAchievements.add('defense_veteran');
        triggerAchievement('defense_veteran', 250);
    }

    currentWave++; waveTimer = 0;
    spawnRate = Math.max(20, 80 - (currentWave * 4)); 
    updateUI(); 
    requestAnimationFrame(animate);
}

// ==========================================
// GAME LOOP & LOGIC
// ==========================================
function animate() {
    if (!gameActive) return;
    try {
        ctx.fillStyle = 'rgba(7, 19, 28, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        if (now - lastFired > (1000 / fireRate)) {
            const target = getNearestEnemy();
            if (target) { fireTurret(target); lastFired = now; }
        }

        if (fireRate >= 15) turret.level = 2; else turret.level = 1;
        if (fireRate >= 40) turret.level = 3;

        if (frameCount++ % Math.floor(spawnRate) === 0) { spawnEnemy(); }

        waveTimer++;
        const progress = (waveTimer / WAVE_DURATION) * 100;
        document.getElementById('wave-progress').style.width = progress + "%";
        
        if (waveTimer >= WAVE_DURATION) { triggerUpgradePhase(); return; }

        updatePhysics(); drawScene();
        requestAnimationFrame(animate);
    } catch (e) { console.error(e); }
}

function getNearestEnemy() {
    if (enemies.length === 0) return null;
    return enemies.reduce((prev, curr) => prev.x < curr.x ? prev : curr);
}

function spawnEnemy() {
    const size = 30 + Math.random() * 20;
    const hp = Math.max(5, currentWave * 5); 
    const speed = 1.5 + (currentWave * 0.3);

    enemies.push({
        x: canvas.width + 50, y: Math.random() * (canvas.height - 100) + 50,
        size: size, speed: speed, hp: hp, maxHp: hp,
        color: `hsl(${Math.random() * 60 + 320}, 80%, 60%)`
    });
}

function fireTurret(target) {
    SoundFX.playShoot();
    const dist = Math.hypot(target.x - turret.x, target.y - turret.y) || 1;
    const timeToImpact = dist / 25;
    const predictedX = target.x - (target.speed * timeToImpact);
    const angle = Math.atan2(target.y - turret.y, predictedX - turret.x) || 0;
    turret.angle = angle;

    const shoot = (offY) => {
        const perpX = Math.cos(angle + Math.PI/2) * offY;
        const perpY = Math.sin(angle + Math.PI/2) * offY;
        const fwdX = Math.cos(angle) * 40;
        const fwdY = Math.sin(angle) * 40;
        projectiles.push({ x: turret.x + fwdX + perpX, y: turret.y + fwdY + perpY, vx: Math.cos(angle)*25, vy: Math.sin(angle)*25 });
    };

    if (turret.level === 1) shoot(0);
    else if (turret.level === 2) { shoot(-10); shoot(10); }
    else if (turret.level === 3) { shoot(-20); shoot(-5); shoot(10); shoot(25); }

    turret.x = 95; setTimeout(() => turret.x = 100, 50);
}

function updatePhysics() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i]; p.x += p.vx; p.y += p.vy;
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (p.x > e.x - e.size/2 && p.x < e.x + e.size/2 && p.y > e.y - e.size/2 && p.y < e.y + e.size/2) {
                hit = true; e.hp--;
                createParticles(p.x, p.y, 3, '#00f3ff');
                if (e.hp <= 0) { createExplosion(e.x, e.y, e.color); enemies.splice(j, 1); }
                break;
            }
        }
        if (hit || p.x > canvas.width + 50) projectiles.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i]; e.x -= e.speed;
        if (e.x < 0) endGame(false);
    }
    updateParticles();
}

function triggerUpgradePhase() {
    if (currentWave >= maxWaves && maxWaves !== 999) { endGame(true); return; }
    generateMathOptions();
    document.getElementById('upgrade-overlay').classList.remove('hidden');
    document.getElementById('upgrade-overlay').classList.add('flex');
}

function generateMathOptions() {
    const makeEq = () => {
        let a, b, val, text;
        switch(difficulty) {
            case 'easy': 
                a = r(30); b = r(30); val=a+b; text=`${a} + ${b}`;
                return { text, raw: val, boost: val/4 };
            case 'normal': 
                a=r(12)+4; b=r(8)+2; val=a*b; text=`${a} x ${b}`;
                return { text, raw: val, boost: val/5 };
            case 'hard': 
                a=r(10)+2; b=r(10)+2; let c=r(10)+2;
                val = a + (b*c); text = `${a} + ${b} x ${c}`;
                return { text, raw: val, boost: val/4 };
            case 'expert': 
                const mode = Math.random();
                if (mode > 0.6) { 
                    let sq = r(12)+2; a=sq*sq; val=sq; text=`√${a}`;
                } else if (mode > 0.3) { 
                    b=r(8)+2; val=r(12)+3; a=b*val; text=`${b}x = ${a}`;
                } else { 
                     val=r(10)+2; b=r(5)+2; a=val/b; text=`x/${b} = ${val}`; 
                }
                return { text, raw: val, boost: val*2 };
            case 'professor': 
                 const profMode = Math.random();
                 if(profMode < 0.25) { 
                     const angles = [0, 30, 45, 60, 90];
                     a = angles[Math.floor(Math.random()*angles.length)];
                     if(a===0) { text=`sin(0°)`; val=0; }
                     else if(a===90) { text=`sin(90°)`; val=1; }
                     else if(a===45) { text=`tan(45°)`; val=1; }
                     else { text=`cos(0°)`; val=1; }
                 } else if (profMode < 0.5) { 
                     a = r(4)+1; val=1; for(let i=1;i<=a;i++) val*=i; text=`${a}!`;
                 } else if (profMode < 0.75) { 
                     let p = r(3); a = Math.pow(10, p); val = p; text=`log(${a})`;
                 } else { 
                     val=r(5); text=`ln(e^${val})`;
                 }
                 return { text, raw: val, boost: val*4.0 }; 
        }
        return { text: "2+2", raw: 4, boost: 2 };
    };

    let opt1 = makeEq(); let opt2 = makeEq(); let safety=0;
    while (Math.abs(opt1.raw - opt2.raw) < (Math.max(opt1.raw, opt2.raw) * 0.1) && safety++ < 10) { opt2 = makeEq(); }

    currentMathOptions.left = opt1; currentMathOptions.right = opt2;
    document.getElementById('math-left').innerText = opt1.text; 
    document.getElementById('math-right').innerText = opt2.text;
}

function r(n) { return Math.floor(Math.random() * n) + 1; }

function triggerPenalty() {
    SoundFX.playError();
    const msg = document.getElementById('penalty-msg'); msg.classList.remove('hidden');
    
    const errOverlay = document.getElementById('error-overlay');
    errOverlay.style.display = 'block';
    
    setTimeout(() => { 
        msg.classList.add('hidden'); 
        errOverlay.style.display = 'none';
    }, 2000);
}

function updateUI() {
    document.getElementById('rate-display').innerText = fireRate.toFixed(1);
    document.getElementById('wave-display').innerText = maxWaves === 999 ? `WAVE ${currentWave}` : `WAVE ${currentWave} / ${maxWaves}`;
    document.getElementById('threat-display').innerText = Math.max(5, currentWave * 5);
}

function createParticles(x, y, count, color) { for(let i=0; i<count; i++) particles.push({x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 30, color}); }
function createExplosion(x, y, color) { SoundFX.playExplosion(); shockwaves.push({x, y, r: 10, alpha: 1.0, color}); createParticles(x, y, 15, color); }
function updateParticles() {
    for (let i = particles.length-1; i>=0; i--) { let p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.life--; if(p.life<=0) particles.splice(i,1); }
    for (let i = shockwaves.length-1; i>=0; i--) { let s=shockwaves[i]; s.r+=2; s.alpha-=0.05; if(s.alpha<=0) shockwaves.splice(i,1); }
}

function drawScene() {
    drawTurret();
    enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 10;
        ctx.fillRect(e.x - e.size/2, e.y - e.size/2, e.size, e.size);
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 0; ctx.fillRect(e.x - 8, e.y - 4, 4, 8); ctx.fillRect(e.x - 8, e.y + 4, 4, 8);
        ctx.fillStyle = 'red'; ctx.fillRect(e.x-15, e.y-25, 30, 4);
        ctx.fillStyle = '#0f0'; ctx.fillRect(e.x-15, e.y-25, 30 * (e.hp/e.maxHp), 4);
    });
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 10; projectiles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); });
    particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
    shockwaves.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.strokeStyle = s.color; ctx.globalAlpha = Math.max(0, s.alpha); ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; });
}

function drawTurret() {
    ctx.save(); ctx.translate(turret.x, turret.y); ctx.rotate(turret.angle);
    ctx.fillStyle = '#0f1926'; ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 2; ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 15;
    if (turret.level === 1) { ctx.fillRect(0, -10, 40, 20); ctx.strokeRect(0, -10, 40, 20); }
    else if (turret.level === 2) { ctx.fillRect(0, -20, 40, 15); ctx.strokeRect(0, -20, 40, 15); ctx.fillRect(0, 5, 40, 15); ctx.strokeRect(0, 5, 40, 15); }
    else if (turret.level === 3) { ctx.fillRect(0, -25, 45, 10); ctx.strokeRect(0, -25, 45, 10); ctx.fillRect(0, -10, 40, 10); ctx.strokeRect(0, -10, 40, 10); ctx.fillRect(0, 5, 40, 10); ctx.strokeRect(0, 5, 40, 10); ctx.fillRect(0, 20, 45, 10); ctx.strokeRect(0, 20, 45, 10); }
    ctx.restore(); ctx.beginPath(); ctx.arc(turret.x, turret.y, 25, 0, Math.PI*2); ctx.fillStyle='#0f1926'; ctx.fill(); ctx.stroke();
}

function endGame(victory) {
    gameActive = false;
    document.getElementById('game-screen').classList.add('hidden');
    
    const screen = document.getElementById('game-over-screen');
    screen.classList.remove('hidden'); screen.classList.add('flex');
    
    if (victory) {
        document.getElementById('end-title').innerText = "MISSION ACCOMPLISHED";
        document.getElementById('end-title').classList.remove('text-red-500');
        document.getElementById('end-title').classList.add('text-green-500');
        document.getElementById('end-subtitle').innerText = "Sector Secured";
        
        if (!sessionAchievements.has('sector_secured')) {
            sessionAchievements.add('sector_secured');
            triggerAchievement('sector_secured', 500); 
        }
    } else {
        document.getElementById('end-title').innerText = "SYSTEM FAILURE";
        document.getElementById('end-title').classList.remove('text-green-500');
        document.getElementById('end-title').classList.add('text-red-500');
        document.getElementById('end-subtitle').innerText = `Overrun at Wave ${currentWave}`;
    }
}
