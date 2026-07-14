export async function onRequestPost(context) {
  try {
    const { email, password, question, answer } = await context.request.json();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // USE context.env.zeriah_labs_db AND make sure column name matches schema (password vs password_hash)
    // Note: I used 'password' here to match your login.js check above. 
    // Ensure your schema.sql created the column as 'password' or 'password_hash'
    await context.env.zeriah_labs_db.prepare(
      'INSERT INTO users (email, password, security_question, security_answer) VALUES (?, ?, ?, ?)'
    ).bind(email, hashHex, question, answer).run();
    
    return new Response(JSON.stringify({ message: 'Account created' }), { 
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
