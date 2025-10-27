#!/bin/bash

echo "🚀 Starting HydroTech Development Environment..."
echo ""

# Check if .env.local exists
if [ ! -f "backend/.env.local" ]; then
    echo "⚠️  backend/.env.local not found!"
    echo "Creating from template..."
    cat > backend/.env.local << EOF
MONGODB_URI=mongodb+srv://hydrotech:vikrant%4019JC@hydrotech.rmmo40o.mongodb.net/
OPENWEATHER_API_KEY=120c1d742105474a5f77dbf48559c643
EOF
    echo "✅ Created backend/.env.local"
fi

if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating from template..."
    cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=318773664238-i46bhdj58m92c6n913o4vp3kamvb64vk.apps.googleusercontent.com
EOF
    echo "✅ Created .env.local"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🐍 Starting Backend (Python)..."
cd backend && python3.8 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

echo ""
echo "⚛️  Starting Frontend (Vite)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo ""
echo "📡 Backend:  http://localhost:8000"
echo "📡 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 Shutting down...'; exit" INT
wait
