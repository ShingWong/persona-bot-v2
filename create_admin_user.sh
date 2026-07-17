#!/bin/bash

# Create an admin user for Persona Bot

set -e

echo "=== Creating Admin User for Persona Bot ==="
echo "Backend URL: http://localhost:6081"
echo

# Default credentials
ADMIN_EMAIL="admin@personabot.com"
ADMIN_PASSWORD="Admin123!"
ADMIN_NAME="System Administrator"

echo "Creating admin user with:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo "  Name: $ADMIN_NAME"
echo

# First, try to register
echo "1. Registering admin user..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:6081/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"name\":\"$ADMIN_NAME\"}")

if echo "$REGISTER_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Admin user registered successfully"
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  
  echo "   User ID: $USER_ID"
  echo "   Access Token: ${ACCESS_TOKEN:0:20}..."
  
  # Now we need to update the user role to ADMIN
  # Since there's no API for this, we need to check if we can do it directly
  echo "⚠️  Note: User created with USER role. To make them ADMIN, you need to:"
  echo "   1. Update the database directly:"
  echo "      UPDATE \"User\" SET role = 'ADMIN' WHERE email = '$ADMIN_EMAIL';"
  echo "   2. Or use an existing admin account to promote this user"
  
elif echo "$REGISTER_RESPONSE" | grep -q '"error":"User already exists"'; then
  echo "⚠️  Admin user already exists"
  
  # Try to login
  echo "2. Logging in as admin..."
  LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:6081/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  
  if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
    echo "✅ Login successful"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Access Token: ${ACCESS_TOKEN:0:20}..."
    echo "   User Role: $USER_ROLE"
    
    if [ "$USER_ROLE" = "ADMIN" ]; then
      echo "✅ User has ADMIN role"
    else
      echo "⚠️  User has $USER_ROLE role (not ADMIN)"
      echo "   To promote to ADMIN, update database:"
      echo "   UPDATE \"User\" SET role = 'ADMIN' WHERE email = '$ADMIN_EMAIL';"
    fi
  else
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    echo
    echo "Possible issues:"
    echo "1. Wrong password"
    echo "2. Account locked"
    echo "3. Different credentials"
  fi
  
else
  echo "❌ Registration failed"
  echo "Response: $REGISTER_RESPONSE"
fi

echo
echo "=== Alternative: Create a test user ==="
TEST_EMAIL="test@personabot.com"
TEST_PASSWORD="test123"
TEST_NAME="Test User"

echo "Creating test user with:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"

TEST_RESPONSE=$(curl -s -X POST "http://localhost:6081/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

if echo "$TEST_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Test user created successfully"
  ACCESS_TOKEN=$(echo "$TEST_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "   Access Token: ${ACCESS_TOKEN:0:20}..."
  echo "   Use this token to access the API"
else
  echo "❌ Test user creation failed"
  echo "Response: $TEST_RESPONSE"
fi

echo
echo "=== Quick Start ==="
echo "1. Use these credentials to login at: http://localhost:6080"
echo "2. Or use the access token in API requests:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:6081/api/personas"
echo
echo "To create an ADMIN user, you need to either:"
echo "1. Update the database directly (see commands above)"
echo "2. Use an existing admin account"
echo "3. Modify the registration code to allow ADMIN role creation"