export async function onRequestPost(context) {
  try {
    const { email } = await context.request.json();
    
    // Find the user by email to retrieve their specific security question
    const user = await context.env.DB.prepare('SELECT security_question FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email not found.' }), { 
        status: 404,
        headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ question: user.security_question }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
