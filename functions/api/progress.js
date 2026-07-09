export async function onRequestGet(context) {
  try {
    // Read the custom header we set up in index.html to identify the user
    const userId = context.request.headers.get('X-User-Id'); 
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch their XP and Level
    const user = await context.env.DB.prepare('SELECT email, xp, level FROM users WHERE id = ?').bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify(user), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
