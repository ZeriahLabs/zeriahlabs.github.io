export async function onRequestPost(context) {
  try {
    const { email, password, question, answer } = await context.request.json();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // ADDED: "RETURNING id, xp, level" grabs the newly created user's data instantly
    const newUser = await context.env.zeriah_labs_db.prepare(
      'INSERT INTO users (email, password_hash, security_question, security_answer) VALUES (?, ?, ?, ?) RETURNING id, xp, level'
    ).bind(email, hashHex, question, answer).first();
    
    // ADDED: We now return the token and stats back to auth.js!
    return new Response(JSON.stringify({ 
        message: 'Account created',
        token: newUser.id,
        xp: newUser.xp,
        level: newUser.level
    }), { 
        status: 201,
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Email already exists or invalid data' }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
    });
  }
}
