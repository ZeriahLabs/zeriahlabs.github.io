export async function onRequestGet(context) {
  // 1. Fetch all achievements from master list
  const { results: allAchievements } = await context.env.zeriah_labs_db
    .prepare('SELECT * FROM achievements_master')
    .all();

  // 2. If user is logged in, fetch their specific progress
  const userId = context.request.headers.get('X-User-Id');
  let userUnlockedIds = [];
  if (userId) {
    const { results } = await context.env.zeriah_labs_db
      .prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?')
      .bind(userId)
      .all();
    userUnlockedIds = results.map(r => r.achievement_id);
  }

  // 3. Merge: Send back the full catalog, marked as 'unlocked' or 'locked'
  const responseData = allAchievements.map(ach => ({
    ...ach,
    isUnlocked: userUnlockedIds.includes(ach.id)
  }));

  return new Response(JSON.stringify(responseData), {
    headers: { "Content-Type": "application/json" }
  });
}
