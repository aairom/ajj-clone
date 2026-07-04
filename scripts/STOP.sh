#!/bin/bash

# Stop script for Asnières Jujitsu Admin System

echo "🥋 Asnières Jujitsu - Stopping Services"
echo "========================================"
echo ""

# ── 1. Try PID file first ─────────────────────────────────────────────────────
if [ -f "server.pid" ]; then
    PID=$(cat server.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping server (PID: $PID)..."
        kill -15 "$PID"
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
            echo "⚠️  Graceful stop failed, forcing kill..."
            kill -9 "$PID" 2>/dev/null
        fi
        echo "✓ Server stopped"
    else
        echo "✓ PID $PID is not running"
    fi
    rm -f server.pid
else
    # ── 2. Fall back: find process by port ───────────────────────────────────
    PORT="${PORT:-3000}"
    echo "🔍 No PID file found. Checking port $PORT ..."
    if command -v lsof &>/dev/null; then
        PID=$(lsof -ti:"$PORT")
    fi

    if [ -n "$PID" ]; then
        echo "🛑 Stopping process $PID on port $PORT..."
        kill -15 "$PID" 2>/dev/null
        sleep 2
        kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null
        echo "✓ Process stopped"
    else
        echo "✓ No process found on port $PORT"
    fi
fi

echo ""
echo "========================================"
echo "✅ Done"
echo ""
echo "To start the server again: ./scripts/START.sh"
echo "========================================"

# Made with Bob
