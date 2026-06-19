#!/bin/bash

# TaskFlow - Quick Start Script
set -e

echo "🚀 Starting TaskFlow..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
}

echo -e "${BLUE}Checking prerequisites...${NC}"
check_command python3
check_command node
check_command npm

# Setup Backend
echo -e "\n${BLUE}Setting up backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "Installing Python dependencies..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created backend/.env from example. Please edit with your values.${NC}"
fi

# Start backend in background
echo -e "${GREEN}Starting FastAPI backend on port 8000...${NC}"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ..

# Setup Frontend
echo -e "\n${BLUE}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages (this may take a minute)..."
    npm install
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created frontend/.env from example.${NC}"
fi

echo -e "${GREEN}Starting React frontend on port 3000...${NC}"
npm start &
FRONTEND_PID=$!

cd ..

echo -e "\n${GREEN}✅ TaskFlow is starting!${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "   API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Goodbye! 👋"
}
trap cleanup EXIT

wait
