#!/bin/bash

# Housie Game Launcher
# Quick start script for the Housie multiplayer game

clear
echo "═══════════════════════════════════════════════════════════════"
echo "   🎱 HOUSIE - MULTIPLAYER TAMBOLA GAME 🎱"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Starting server..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
node server.js
