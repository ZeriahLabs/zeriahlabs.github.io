export async function onRequestPost(context) {
  try {
    const { email, password } = await context.request.json();
    
    // Hash password (ensure this matches the hashing method in register.js)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // USE context.env.zeriah_labs_db
    const user = await context.env.zeriah_labs_db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    
    if (!user || user.password_hash !== hashHex) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
      });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Login successful', 
      token: user.id, 
      xp: user.xp, 
      level: user.level 
    }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}
