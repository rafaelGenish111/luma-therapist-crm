#!/bin/bash

echo "🚀 Starting Wellness Platform for network access..."
echo "📱 Other devices can access at: http://192.168.150.133:8000"
echo ""

# Start server in background
echo "🔧 Starting server..."
cd server && npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client in background
echo "🎨 Starting client..."
cd ../client && npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ Both server and client are starting..."
echo "📊 Server: http://192.168.150.133:5000"
echo "🎨 Client: http://192.168.150.133:8000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
trap "echo '🛑 Stopping services...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait
