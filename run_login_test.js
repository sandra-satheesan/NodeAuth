const http = require('http');

const data = JSON.stringify({ email: 'test@example.com', password: 'password123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  res.setEncoding('utf8');
  let raw = '';
  res.on('data', (chunk) => { raw += chunk; });
  res.on('end', () => {
    console.log('BODY:', raw);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
