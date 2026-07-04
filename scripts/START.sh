#!/bin/bash

# Start script for Asnières Jujitsu Admin System (detached mode)

echo "🥋 Asnières Jujitsu - Admin System"
echo "==================================="
echo ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Download from: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# ── 2. Install dependencies if missing ───────────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --silent
fi

# ── 3. Create .env from template if missing ──────────────────────────────────
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env from .env.example ..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: edit .env and set a strong JWT_SECRET before production use!"
fi

# ── 4. Initialise database if missing ────────────────────────────────────────
if [ ! -f "data/admin.db" ]; then
    echo "🗄️  Initialising database..."
    npm run init-db --silent
fi

# ── 5. Resolve port ──────────────────────────────────────────────────────────
PORT="${PORT:-3000}"

# ── 6. Check port availability ───────────────────────────────────────────────
if lsof -ti:"$PORT" &>/dev/null; then
    echo "⚠️  Port $PORT is already in use. Set a different PORT in .env or stop the existing process."
    exit 1
fi

# ── 7. Start server in background ────────────────────────────────────────────
echo ""
echo "🚀 Starting server on port $PORT (detached)..."
nohup node server.js > server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid

# Wait briefly to confirm the process is alive
sleep 2
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "❌ Server failed to start. Check server.log for details."
    exit 1
fi

echo ""
echo "==================================="
echo "✅ Server running (PID: $SERVER_PID)"
echo ""
echo "  🌐  Site:        http://localhost:$PORT"
echo "  🔐  Admin panel: http://localhost:$PORT/admin/login.html"
echo ""
echo "  Default credentials:"
echo "    Username: admin"
echo "    Password: admin123"
echo ""
echo "  📋  Logs:  tail -f server.log"
echo "  🛑  Stop:  ./scripts/STOP.sh"
echo "==================================="

# Made with Bob
