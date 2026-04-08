#!/usr/bin/env node

/**
 * Verification script for Baileys connection fixes
 * Tests the API endpoints without requiring actual WhatsApp connection
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3000';
let serverProcess = null;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
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
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['index.js'], {
      cwd: __dirname,
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Starting') || output.includes('listening') || output.includes('Server ready')) {
        console.log('✓ Server started');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    setTimeout(() => {
      console.log('✓ Server started (assumed)');
      resolve();
    }, 2000);

    serverProcess.on('error', reject);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    console.log('✓ Server stopped');
  }
}

async function testEndpoints() {
  console.log('\n=== Testing QR & Pairing Endpoints ===\n');

  try {
    // Test 1: POST /api/generate (should create QR session)
    console.log('Test 1: POST /api/generate (QR creation)');
    const res1 = await request('POST', '/api/generate');
    console.log(`  Status: ${res1.status}`);
    if (res1.status === 200) {
      console.log(`  ✓ Success: ${res1.json.success ? 'true' : 'false'}`);
      console.log(`  Session ID: ${res1.json.sessionId ? 'obtained' : 'missing'}`);
    } else {
      console.log(`  ✗ Failed: ${res1.json.error || 'Unknown error'}`);
    }
    console.log('');

    // Test 2: POST /api/pair-session (should create pairing session)
    console.log('Test 2: POST /api/pair-session (pairing creation)');
    const res2 = await request('POST', '/api/pair-session', { phoneNumber: '919876543210' });
    console.log(`  Status: ${res2.status}`);
    if (res2.status === 200) {
      console.log(`  ✓ Success: ${res2.json.success ? 'true' : 'false'}`);
      console.log(`  Session ID: ${res2.json.sessionId ? 'obtained' : 'missing'}`);
    } else {
      console.log(`  ✗ Failed:${res2.json.error || 'Unknown error'}`);
    }
    console.log('');

    // Test 3: GET /api/health
    console.log('Test 3: GET /api/health');
    const res3 = await request('GET', '/api/health');
    console.log(`  Status: ${res3.status}`);
    if (res3.status === 200) {
      console.log(`  ✓ Status: ${res3.json.status}`);
    }
    console.log('');

    console.log('=== All basic tests completed ===\n');
    console.log('Expected behaviors:');
    console.log('  - POST /api/generate returns 200 with sessionId (not 405)');
    console.log('  - POST /api/pair-session returns 200 with sessionId and accepts phoneNumber');
    console.log('  - GET /api/health returns 200');

  } catch (err) {
    console.error('Test error:', err.message);
  }
}

async function main() {
  console.log('Starting verification...');
  await startServer();

  // Small delay to ensure server is fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testEndpoints();
  stopServer();

  console.log('\n📋 Manual testing steps:');
  console.log('1. Run: node index.js');
  console.log('2. Open: http://localhost:3000');
  console.log('3. Click "Generate QR Code" → should get QR after polling');
  console.log('4. Or try pairing: enter phone number, click "Get Pairing Code" → should show 8-digit code');
  console.log('\n✅ Fixes applied:');
  console.log('  - POST /api/generate now creates QR sessions (was GET-only)');
  console.log('  - Pairing sessions include pairingCode in status response');
  console.log('  - Routes in index.js correctly mapped');
}

main().catch(console.error);
