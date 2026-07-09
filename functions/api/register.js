// File: functions/api/register.js

export async function onRequestPost(context) {
  try {
    // 1. Get the data sent from your frontend index.html
    const { email, password, question, answer } = await context.request.json();
    
    // 2. Hash the password using Web Crypto API (required for Cloudflare edge)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Insert the new user into the D1 Database
    await context.env.DB.prepare(
      'INSERT INTO users (email, password_hash, security_question, security_answer) VALUES (?, ?, ?, ?)'
    ).bind(email, hashHex, question, answer).run();
    
    // 4. Return success to the frontend
    return new Response(JSON.stringify({ message: 'Account created' }), { 
        status: 201,
        headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    // If the database throws an error (e.g., the email already exists because of the UNIQUE constraint)
    return new Response(JSON.stringify({ error: 'Email already exists or invalid data' }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
    });
  }
}
