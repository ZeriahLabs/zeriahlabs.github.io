// File: functions/api/unlock-achievement.js

export async function onRequestPost(context) {
  try {
    // 1. Get the data sent from your game
    const { userId, achievementId, xpReward } = await context.request.json();
    
    if (!userId || !achievementId) {
        return new Response(JSON.stringify({ error: 'Missing data' }), { status: 400 });
    }

    // 2. Check if the user already unlocked this achievement
    const existing = await context.env.DB.prepare(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
    ).bind(userId, achievementId).first();
    
    if (existing) {
      return new Response(JSON.stringify({ message: 'Achievement already unlocked' }), { 
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Record the achievement
    await context.env.DB.prepare(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
    ).bind(userId, achievementId).run();

    // 4. Add the XP to the user's total
    await context.env.DB.prepare(
      'UPDATE users SET xp = xp + ? WHERE id = ?'
    ).bind(xpReward || 50, userId).run();

    // 5. Check if they leveled up (Example threshold logic)
    const user = await context.env.DB.prepare('SELECT xp, level FROM users WHERE id = ?').bind(userId).first();
    let newLevel = user.level;
    
    // Simple level-up check: If they cross 1000 XP, upgrade them to Level 5!
    if (user.xp >= 1000 && user.level === 'Level 4 Rookie') {
        newLevel = 'Level 5 Scholar';
        await context.env.DB.prepare('UPDATE users SET level = ? WHERE id = ?').bind(newLevel, userId).run();
    }
    
    return new Response(JSON.stringify({ success: true, newXp: user.xp, newLevel: newLevel }), { 
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
