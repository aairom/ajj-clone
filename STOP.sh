#!/bin/bash

# Stop Script for Asnières Jujitsu Admin System

echo "🥋 Asnières Jujitsu - Stopping Services"
echo "========================================"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔍 Checking for processes on port $port..."
    
    # Find process ID using the port
    if command -v lsof &> /dev/null; then
        # macOS/Linux with lsof
        PID=$(lsof -ti:$port)
    elif command -v netstat &> /dev/null; then
        # Linux with netstat
        PID=$(netstat -nlp 2>/dev/null | grep :$port | awk '{print $7}' | cut -d'/' -f1)
    else
        echo "⚠️  Cannot find lsof or netstat command"
        return 1
    fi
    
    if [ -z "$PID" ]; then
        echo "✓ No process found on port $port"
        return 0
    fi
    
    echo "🛑 Stopping process $PID on port $port..."
    kill -15 $PID 2>/dev/null
    
    # Wait a bit and check if process is still running
    sleep 2
    
    if kill -0 $PID 2>/dev/null; then
        echo "⚠️  Process still running, forcing kill..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
    
    if kill -0 $PID 2>/dev/null; then
        echo "❌ Failed to stop process $PID"
        return 1
    else
        echo "✓ Process stopped successfully"
        return 0
    fi
}

# Stop Node.js server (default port 3000)
kill_port 3000

echo ""

# Check for any remaining node processes related to this project
echo "🔍 Checking for remaining Node.js processes..."
PROJECT_DIR=$(pwd)

if command -v pgrep &> /dev/null; then
    # Find node processes
    NODE_PIDS=$(pgrep -f "node.*server.js")
    
    if [ -n "$NODE_PIDS" ]; then
        echo "🛑 Found Node.js processes: $NODE_PIDS"
        for pid in $NODE_PIDS; do
            # Check if process is in current directory
            PROC_DIR=$(pwdx $pid 2>/dev/null | awk '{print $2}')
            if [ "$PROC_DIR" = "$PROJECT_DIR" ]; then
                echo "   Stopping process $pid..."
                kill -15 $pid 2>/dev/null
            fi
        done
        sleep 1
    else
        echo "✓ No additional Node.js processes found"
    fi
fi

echo ""
echo "========================================"
echo "✅ All services stopped"
echo ""
echo "To start the server again, run:"
echo "   ./START.sh"
echo "   or"
echo "   npm start"
echo "========================================"

# Made with Bob