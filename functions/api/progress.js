// File: functions/api/progress.js (UPDATED)

export async function onRequestGet(context) {
  try {
    const userId = context.request.headers.get('X-User-Id'); 
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 1. Fetch their XP and Level
    const user = await context.env.DB.prepare('SELECT email, xp, level FROM users WHERE id = ?').bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // 2. Fetch their unlocked achievements
    const achievementsQuery = await context.env.DB.prepare(
        'SELECT achievement_id FROM user_achievements WHERE user_id = ?'
    ).bind(userId).all();
    
    // Convert the database rows into a simple array (e.g., ['first_contact', 'math_initiate'])
    const unlockedAchievements = achievementsQuery.results.map(row => row.achievement_id);
    
    // 3. Send everything back to the frontend
    return new Response(JSON.stringify({
        email: user.email,
        xp: user.xp,
        level: user.level,
        unlocked: unlockedAchievements
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
