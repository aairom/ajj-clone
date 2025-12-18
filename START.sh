#!/bin/bash

# Quick Start Script for Asnières Jujitsu Admin System

echo "🥋 Asnières Jujitsu - Admin System Quick Start"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  IMPORTANT: Edit .env and change JWT_SECRET before production use!"
    echo ""
fi

# Check if database exists
if [ ! -f "data/admin.db" ]; then
    echo "🗄️  Initializing database..."
    npm run init-db
    echo ""
fi

echo "🚀 Starting server..."
echo ""
echo "Admin panel will be available at:"
echo "   http://localhost:3000/admin/login.html"
echo ""
echo "Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=============================================="
echo ""

npm start

# Made with Bob
