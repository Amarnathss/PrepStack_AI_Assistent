#!/bin/bash
# Build script for DigitalOcean deployment

echo "🔧 Installing dependencies..."
npm install

echo "🔧 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "🔧 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "🔧 Building frontend..."
cd frontend && npm run build && cd ..

echo "🔧 Creating public directory in backend..."
mkdir -p backend/public

echo "🔧 Copying frontend build to backend public..."
cp -r frontend/dist/* backend/public/

echo "✅ Build complete!"