#!/bin/bash
# Monitor backend requests for 30 seconds

echo "Monitoring backend requests on port 6081 for 30 seconds..."
echo "Press Ctrl+C to stop early"
echo ""

# Count requests to /api/auth/me
count=0
start_time=$(date +%s)

# Use netcat to listen and count
timeout 30 bash -c '
while true; do
  # Listen for one connection and count if it contains /api/auth/me
  echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK" | \
  nc -l -p 6083 -w 1 | grep -q "/api/auth/me" && echo "Request to /api/auth/me detected"
done
' 2>/dev/null &

# Also monitor backend logs
echo "Checking backend logs for /api/auth/me requests..."
tail -f /tmp/backend3.log 2>/dev/null | grep --line-buffered "/api/auth/me" &
log_pid=$!

sleep 30
kill $log_pid 2>/dev/null
pkill -f "nc -l -p 6083"

echo ""
echo "Monitoring complete."
echo "If you saw many 'Request to /api/auth/me detected' messages, the infinite loop still exists."