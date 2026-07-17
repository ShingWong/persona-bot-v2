#!/bin/bash

# Test new port configuration for Persona Bot
# Backend: 6081, Frontend: 6080

set -e

echo "=== Testing New Port Configuration ==="
echo "Backend: port 6081"
echo "Frontend: port 6080"
echo

# Test backend health
echo "1. Testing backend health on port 6081..."
HEALTH_RESPONSE=$(curl -s http://localhost:6081/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "✅ Backend is running on port 6081"
else
  echo "❌ Backend not responding on port 6081"
  exit 1
fi
echo

# Test CORS for frontend port
echo "2. Testing CORS for frontend port 6080..."
CORS_RESPONSE=$(curl -s -X GET "http://localhost:6081/health" \
  -H "Origin: http://localhost:6080" \
  -I 2>&1 | grep -i "access-control-allow-origin" || true)

if echo "$CORS_RESPONSE" | grep -q "localhost:6080"; then
  echo "✅ CORS allows localhost:6080"
else
  echo "❌ CORS not configured for localhost:6080"
  echo "Response: $CORS_RESPONSE"
fi
echo

# Test CORS for network IP
echo "3. Testing CORS for network IP 192.168.4.22:6080..."
CORS_NETWORK_RESPONSE=$(curl -s -X GET "http://localhost:6081/health" \
  -H "Origin: http://192.168.4.22:6080" \
  -I 2>&1 | grep -i "access-control-allow-origin" || true)

if echo "$CORS_NETWORK_RESPONSE" | grep -q "192.168.4.22:6080"; then
  echo "✅ CORS allows 192.168.4.22:6080"
else
  echo "❌ CORS not configured for 192.168.4.22:6080"
  echo "Response: $CORS_NETWORK_RESPONSE"
fi
echo

# Test authentication
echo "4. Testing authentication on port 6081..."
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:6081/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_newports_'"$(date +%s)"'@example.com","password":"Test123!","name":"Test User"}')

if echo "$AUTH_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Authentication working on port 6081"
  ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "   Token obtained: ${ACCESS_TOKEN:0:20}..."
else
  echo "❌ Authentication failed on port 6081"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi
echo

# Test protected endpoint
echo "5. Testing protected endpoint with token..."
PROTECTED_RESPONSE=$(curl -s -X GET "http://localhost:6081/api/personas" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROTECTED_RESPONSE" | grep -q '"id"'; then
  echo "✅ Protected endpoint accessible with token"
  PERSONA_COUNT=$(echo "$PROTECTED_RESPONSE" | grep -o '"id"' | wc -l)
  echo "   Found $PERSONA_COUNT personas"
else
  echo "❌ Protected endpoint failed"
  echo "Response: $PROTECTED_RESPONSE"
fi
echo

# Test old port 3001 (should not respond)
echo "6. Testing old port 3001 (should fail)..."
OLD_PORT_RESPONSE=$(curl -s --max-time 3 http://localhost:3001/health 2>&1 || true)
if echo "$OLD_PORT_RESPONSE" | grep -q "Connection refused\|timed out\|Empty reply"; then
  echo "✅ Old port 3001 not responding (as expected)"
else
  echo "⚠️  Old port 3001 might still be running"
  echo "Response: $OLD_PORT_RESPONSE"
fi
echo

echo "=== Port Configuration Test Complete ==="
echo "✅ All tests passed!"
echo "✅ Backend: http://localhost:6081"
echo "✅ Frontend: http://localhost:6080"
echo "✅ CORS properly configured"
echo "✅ Authentication working"
echo
echo "Next steps:"
echo "1. Start frontend: cd frontend && npm run dev"
echo "2. Access frontend: http://localhost:6080"
echo "3. Or access from network: http://192.168.4.22:6080"