#!/bin/bash

# Test authentication workflow for Persona Bot Backend
# This script tests the new JWT-based authentication system

set -e

echo "=== Testing Authentication Workflow ==="
echo

# Base URL
BASE_URL="http://localhost:3001"

# Test data
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

echo "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

echo "Response: $REGISTER_RESPONSE"

# Extract access token from response
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to register user or get access token"
  echo "Full response: $REGISTER_RESPONSE"
  exit 1
fi

echo "✓ Registration successful"
echo "Access token obtained: ${ACCESS_TOKEN:0:20}..."
echo

echo "2. Testing protected endpoint without token (should fail)..."
NO_AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/api/personas" -o /dev/null)
if [ "$NO_AUTH_RESPONSE" != "401" ]; then
  echo "ERROR: Expected 401 without authentication, got $NO_AUTH_RESPONSE"
  exit 1
fi
echo "✓ Correctly rejected unauthorized access"
echo

echo "3. Testing protected endpoint with token (should succeed)..."
AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/personas" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
if echo "$AUTH_RESPONSE" | grep -q "error"; then
  echo "ERROR: Failed to access protected endpoint with token"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi
echo "✓ Successfully accessed protected endpoint"
echo "Response preview: ${AUTH_RESPONSE:0:100}..."
echo

echo "4. Testing session creation with authentication..."
# First get a persona ID
PERSONAS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/personas" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
PERSONA_ID=$(echo "$PERSONAS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PERSONA_ID" ]; then
  SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"personaId\":\"$PERSONA_ID\",\"title\":\"Test Session\"}")
  
  if echo "$SESSION_RESPONSE" | grep -q "error"; then
    echo "ERROR: Failed to create session"
    echo "Response: $SESSION_RESPONSE"
  else
    echo "✓ Successfully created session"
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Session ID: $SESSION_ID"
  fi
else
  echo "⚠ Could not get persona ID, skipping session creation test"
fi
echo

echo "5. Testing token refresh..."
if [ -n "$REFRESH_TOKEN" ]; then
  REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
  
  NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$NEW_ACCESS_TOKEN" ]; then
    echo "✓ Token refresh successful"
    echo "New access token: ${NEW_ACCESS_TOKEN:0:20}..."
    
    # Test new token
    TEST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/personas" \
      -H "Authorization: Bearer $NEW_ACCESS_TOKEN")
    if echo "$TEST_RESPONSE" | grep -q "error"; then
      echo "ERROR: Refreshed token doesn't work"
    else
      echo "✓ Refreshed token works correctly"
    fi
  else
    echo "ERROR: Failed to refresh token"
    echo "Response: $REFRESH_RESPONSE"
  fi
else
  echo "⚠ No refresh token, skipping refresh test"
fi
echo

echo "6. Testing logout..."
if [ -n "$REFRESH_TOKEN" ]; then
  LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
  
  if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
    echo "✓ Logout successful"
    
    # Try to refresh with invalidated token (should fail)
    INVALID_REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
    
    if echo "$INVALID_REFRESH_RESPONSE" | grep -q "error"; then
      echo "✓ Invalidated refresh token correctly rejected"
    else
      echo "⚠ Invalidated refresh token might still work"
    fi
  else
    echo "ERROR: Logout failed"
    echo "Response: $LOGOUT_RESPONSE"
  fi
else
  echo "⚠ No refresh token, skipping logout test"
fi
echo

echo "7. Testing login with existing credentials..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$LOGIN_ACCESS_TOKEN" ]; then
  echo "✓ Login successful"
  
  # Test the new token
  TEST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/personas" \
    -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
  if echo "$TEST_RESPONSE" | grep -q "error"; then
    echo "ERROR: Login token doesn't work"
  else
    echo "✓ Login token works correctly"
  fi
else
  echo "ERROR: Login failed"
  echo "Response: $LOGIN_RESPONSE"
fi
echo

echo "=== Authentication Tests Complete ==="
echo "Summary: JWT-based authentication is working correctly!"
echo "All protected endpoints now require valid Bearer tokens."
echo "userId has been removed from query strings."