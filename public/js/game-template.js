// game-template.js
// Use this file to write your specific game logic.

async function triggerAchievement(achievementId, xpReward) {
    const userId = localStorage.getItem('zeriah_token');
    if (!userId) return;

    try {
        const response = await fetch('/api/unlock-achievement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, achievementId, xpReward })
        });
        
        const result = await response.json();
        if (result.isLevelUp) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        // Redraw the UI to show the newly unlocked badge
        if (typeof window.renderAchievements === 'function') {
            window.renderAchievements();
        }
    } catch (err) {
        console.error("Achievement failed", err);
    }
}

// TODO: Write game loop here...
// When a win condition is met, call: triggerAchievement('your_db_id', 50);
