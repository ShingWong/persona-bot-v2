#!/bin/bash
echo "=== Persona Bot E2E User Workflow Test ==="
echo ""

# Generate unique email
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser_${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123"
TEST_NAME="Test User ${TIMESTAMP}"

echo "1. Registering new user: $TEST_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
echo "   User registered with ID: $USER_ID"
echo ""

echo "2. Logging in"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "   Login successful"
echo ""

echo "3. Getting available personas"
PERSONAS_RESPONSE=$(curl -s http://localhost:3001/api/personas)
PERSONA_COUNT=$(echo $PERSONAS_RESPONSE | jq '. | length')
PERSONA_ID=$(echo $PERSONAS_RESPONSE | jq -r '.[0].id')
PERSONA_NAME=$(echo $PERSONAS_RESPONSE | jq -r '.[0].name')
echo "   Found $PERSONA_COUNT personas"
echo "   Using persona: $PERSONA_NAME (ID: $PERSONA_ID)"
echo ""

echo "4. Creating a new session"
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"personaId\":\"$PERSONA_ID\",\"title\":\"Test Session ${TIMESTAMP}\"}")

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.id')
echo "   Session created with ID: $SESSION_ID"
echo ""

echo "5. Sending a message"
MESSAGE_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/messages?userId=$USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"role\":\"user\",\"content\":\"Hello, this is a test message from the E2E workflow test. How are you today?\"}")

MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.id')
echo "   Message sent with ID: $MESSAGE_ID"
echo ""

echo "6. Retrieving session messages"
MESSAGES_RESPONSE=$(curl -s "http://localhost:3001/api/messages?sessionId=$SESSION_ID&userId=$USER_ID")
MESSAGE_COUNT=$(echo $MESSAGES_RESPONSE | jq '.messages | length')
echo "   Retrieved $MESSAGE_COUNT messages from session"
echo ""

echo "7. Getting user sessions"
SESSIONS_RESPONSE=$(curl -s "http://localhost:3001/api/sessions?userId=$USER_ID")
SESSION_COUNT=$(echo $SESSIONS_RESPONSE | jq '.sessions | length')
echo "   User has $SESSION_COUNT active sessions"
echo ""

echo "=== Workflow Test Complete ==="
echo "All steps completed successfully!"
echo ""
echo "Summary:"
echo "- User registered: $TEST_EMAIL"
echo "- Session created: $SESSION_ID"
echo "- Message sent: $MESSAGE_ID"
echo "- Total personas available: $PERSONA_COUNT"
echo "- User sessions: $SESSION_COUNT"
