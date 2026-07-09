// File: functions/api/login.js

export async function onRequestPost(context) {
  try {
    // 1. Get the data sent from your frontend index.html
    const { email, password } = await context.request.json();
    
    // 2. Hash the password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Query the D1 Database 
    // (Note: context.env.DB is how Pages connects to your database)
    const user = await context.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    
    if (!user || user.password_hash !== hashHex) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }
    
    // 4. Return success to the frontend
    return new Response(JSON.stringify({ message: 'Login successful', xp: user.xp, level: user.level }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
