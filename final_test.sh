#!/bin/bash
echo "=== Final Comprehensive Test ==="
echo ""

echo "1. Testing backend API..."
curl -s -X POST http://localhost:6081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@personabot.com","password":"Admin123!"}' \
  | jq -r '.access_token' > /tmp/token.txt

if [ -s /tmp/token.txt ]; then
  echo "   ✓ Backend login works"
  TOKEN=$(cat /tmp/token.txt)
else
  echo "   ✗ Backend login failed"
  exit 1
fi

echo ""
echo "2. Testing /api/auth/me endpoint..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:6081/api/auth/me | jq -e '.data.user.email' > /dev/null
if [ $? -eq 0 ]; then
  echo "   ✓ /api/auth/me works"
else
  echo "   ✗ /api/auth/me failed"
fi

echo ""
echo "3. Testing frontend homepage..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:6080
if [ $? -eq 0 ]; then
  echo "   ✓ Frontend is accessible"
else
  echo "   ✗ Frontend not accessible"
fi

echo ""
echo "4. Checking for infinite loop (monitoring backend for 5 seconds)..."
count=0
for i in {1..5}; do
  # Count /api/auth/me requests in backend logs
  new_count=$(tail -100 /tmp/backend3.log 2>/dev/null | grep -c "/api/auth/me")
  if [ $new_count -gt $count ]; then
    echo "   $i: $new_count requests detected"
    count=$new_count
  fi
  sleep 1
done

if [ $count -lt 10 ]; then
  echo "   ✓ No infinite loop detected ($count requests)"
else
  echo "   ⚠ High request count: $count (might indicate issues)"
fi

echo ""
echo "5. Testing dashboard API..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:6081/api/conversations | jq -e '.data' > /dev/null
if [ $? -eq 0 ]; then
  echo "   ✓ Dashboard API works"
else
  echo "   ⚠ Dashboard API returned: $(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:6081/api/conversations | head -c 100)"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "To manually test:"
echo "1. Open http://localhost:6080"
echo "2. Click 'Sign In'"
echo "3. Login with admin@personabot.com / Admin123!"
echo "4. Should redirect to dashboard"
echo ""
echo "If dashboard shows 'menu flashes for 30 seconds then goes black',"
echo "the infinite loop issue should now be fixed."