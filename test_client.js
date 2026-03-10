(async () => {
  try {
    const base = 'http://localhost:5000';
    // Register
    let res = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'password123' })
    });
    console.log('Register status', res.status);
    console.log('Register headers', Object.fromEntries(res.headers.entries()));
    console.log('Register body', await res.text());

    // Login
    res = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    console.log('Login status', res.status);
    console.log('Login headers', Object.fromEntries(res.headers.entries()));
    console.log('Set-Cookie header', res.headers.get('set-cookie'));
    console.log('Login body', await res.text());
  } catch (err) {
    console.error('Error in test client', err);
  }
})();
