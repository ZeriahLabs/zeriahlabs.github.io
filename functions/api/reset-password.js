export async function onRequestPost(context) {
  try {
    const { email, answer, newPassword } = await context.request.json();
    
    const user = await context.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    
    // Check if user exists and if the answer matches
    if (!user || user.security_answer !== answer) {
      return new Response(JSON.stringify({ error: 'Incorrect answer.' }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Hash the new password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Update the database with the new hashed password
    await context.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hashHex, user.id).run();
    
    return new Response(JSON.stringify({ message: 'Password updated successfully!' }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
