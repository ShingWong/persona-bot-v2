#!/usr/bin/env node
/**
 * Debug script to test the auth loop issue
 */

const http = require('http');

let requestCount = 0;
const startTime = Date.now();

// Create a simple server to count requests
const server = http.createServer((req, res) => {
  requestCount++;
  
  if (req.url === '/api/auth/me') {
    console.log(`[${Date.now() - startTime}ms] Request #${requestCount}: ${req.url}`);
    
    // Simulate a slow response (like the real backend might be)
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        data: {
          user: {
            id: 'test-id',
            email: 'admin@personabot.com',
            role: 'ADMIN',
            is_active: true,
            email_verified: false
          }
        }
      }));
    }, 100);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(6082, () => {
  console.log('Debug server listening on port 6082');
  console.log('This simulates the backend to count /api/auth/me requests');
  
  // Auto-stop after 10 seconds
  setTimeout(() => {
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total requests in 10 seconds: ${requestCount}`);
    console.log(`Average requests per second: ${requestCount / 10}`);
    console.log(`\nIf this shows hundreds of requests, the frontend has an infinite loop.`);
    process.exit(0);
  }, 10000);
});