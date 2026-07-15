export async function onRequestPost(context) {
  try {
    const { userId, achievementId, xpReward } = await context.request.json();
    
    // 1. Validation
    if (!userId || !achievementId) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // 2. Check if already unlocked (using your correct binding: zeriah_labs_db)
    const existing = await context.env.zeriah_labs_db.prepare(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
    ).bind(userId, achievementId).first();
    
    if (existing) {
      return new Response(JSON.stringify({ message: 'Achievement already unlocked' }), { 
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }

    // 3. Record the achievement
    await context.env.zeriah_labs_db.prepare(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
    ).bind(userId, achievementId).run();

    // 4. Update XP
    await context.env.zeriah_labs_db.prepare(
      'UPDATE users SET xp = xp + ? WHERE id = ?'
    ).bind(xpReward || 50, userId).run();

    // ... (Your existing steps 1-4)

    // 5. Fetch updated user
    const user = await context.env.zeriah_labs_db.prepare(
      'SELECT xp, level FROM users WHERE id = ?'
    ).bind(userId).first();
    
    // MODIFIED: Simplified Level-Up Logic
    // If xp is over 1000 and they are still a 'Rookie', upgrade them.
    let newLevel = user.level;
    if (user.xp >= 1000 && user.level === 'Level 4 Rookie') {
      newLevel = 'Level 5 Scholar';
      await context.env.zeriah_labs_db.prepare(
        'UPDATE users SET level = ? WHERE id = ?'
      ).bind(newLevel, userId).run();
    }
    
    // OPTIONAL: Add a return field to trigger confetti!
    return new Response(JSON.stringify({ 
        success: true, 
        newXp: user.xp, 
        newLevel: newLevel,
        isLevelUp: newLevel !== user.level // This helps the frontend know when to show confetti
    }), { 
      status: 200, headers: { "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
