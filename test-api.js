// Test API endpoints
const http = require('http');

function testEndpoint(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== API Tests ===\n');

  // Test 1: POST /api/generate (frontend expects this to create QR session)
  try {
    console.log('Test 1: POST /api/generate');
    const res = await testEndpoint('POST', '/api/generate');
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${res.body}\n`);
  } catch (err) {
    console.error('Test 1 failed:', err.message, '\n');
  }

  // Test 2: GET /api/generate?sessionId=xxx (current broken implementation)
  // This would be the intended download endpoint but should be GET /api/download
  try {
    console.log('Test 2: GET /api/status (health check)');
    const res = await testEndpoint('GET', '/api/health');
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${res.body}\n`);
  } catch (err) {
    console.error('Test 2 failed:', err.message, '\n');
  }
}

runTests().then(() => {
  console.log('Tests complete. Start server with: node index.js');
});
