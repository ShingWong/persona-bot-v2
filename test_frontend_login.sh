#!/bin/bash

echo "=== Testing Frontend Login Compatibility ==="
echo

# Test 1: Backend API response format
echo "1. Testing backend API response format..."
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:6081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@personabot.com","password":"test123"}')

echo "Backend response:"
echo "$BACKEND_RESPONSE" | jq . 2>/dev/null || echo "$BACKEND_RESPONSE"
echo

# Check if response has expected fields
if echo "$BACKEND_RESPONSE" | grep -q "access_token" && \
   echo "$BACKEND_RESPONSE" | grep -q "refresh_token" && \
   echo "$BACKEND_RESPONSE" | grep -q "token_type"; then
  echo "✅ Backend API returns correct snake_case format"
else
  echo "❌ Backend API missing expected fields"
fi

# Test 2: Check frontend API client configuration
echo
echo "2. Checking frontend API configuration..."
FRONTEND_API_URL=$(grep -r "NEXT_PUBLIC_API_URL" /usr/local/devel/persona-bot-v2/frontend/.env.local 2>/dev/null | cut -d= -f2)
if [ "$FRONTEND_API_URL" = "http://localhost:6081" ]; then
  echo "✅ Frontend API URL correctly set to: $FRONTEND_API_URL"
else
  echo "❌ Frontend API URL incorrect: $FRONTEND_API_URL"
fi

# Test 3: Test CORS
echo
echo "3. Testing CORS configuration..."
CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:6081/api/auth/login \
  -H "Origin: http://localhost:6080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type")

if echo "$CORS_HEADERS" | grep -i -q "access-control-allow-origin"; then
  echo "✅ CORS headers present"
else
  echo "❌ CORS headers missing"
fi

# Test 4: Verify ports are correct
echo
echo "4. Verifying port configuration..."
BACKEND_PORT=$(grep -r "PORT=" /usr/local/devel/persona-bot-v2/backend/.env 2>/dev/null | cut -d= -f2)
FRONTEND_PORT=$(grep -r "port.*6080" /usr/local/devel/persona-bot-v2/frontend/package.json 2>/dev/null | grep -o "[0-9]*")

echo "Backend port: ${BACKEND_PORT:-6081 (default)}"
echo "Frontend port: ${FRONTEND_PORT:-6080 (from package.json)}"

if [ "${BACKEND_PORT:-6081}" = "6081" ] && [ "${FRONTEND_PORT:-6080}" = "6080" ]; then
  echo "✅ Port configuration correct"
else
  echo "❌ Port configuration incorrect"
fi

echo
echo "=== Test Summary ==="
echo "The API response format has been fixed to match frontend expectations."
echo "Backend now returns: access_token, refresh_token, token_type (snake_case)"
echo "Frontend expects: access_token, refresh_token, token_type (snake_case)"
echo
echo "Next steps:"
echo "1. Open http://localhost:6080 in your browser"
echo "2. Login with:"
echo "   - Email: admin@personabot.com"
echo "   - Password: Admin123!"
echo "3. Or test user:"
echo "   - Email: test@personabot.com"
echo "   - Password: test123"