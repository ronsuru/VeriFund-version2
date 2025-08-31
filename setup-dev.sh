#!/bin/bash

# Verifund Development Environment Setup Script
# This script sets up the local development environment

set -e

echo "🚀 Setting up Verifund Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual values:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - SESSION_SECRET (random string for session encryption)"
    echo "   - Other service keys as needed"
    echo ""
    echo "📝 Your Supabase credentials are already configured!"
else
    echo "✅ .env file already exists"
fi

# Check if Docker is available for optional containerized setup
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected - you can use containerized development:"
    echo "   docker-compose up -d    # Start PostgreSQL + Redis"
    echo "   docker-compose up app   # Start app with hot reload"
    echo ""
fi

# Check if PostgreSQL is available locally
if command -v psql &> /dev/null; then
    echo "🐘 PostgreSQL detected locally"
    echo "   You can create a local database or use Supabase"
else
    echo "💡 Consider using Supabase for database or install PostgreSQL locally"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up Supabase project (see README.md)"
echo "3. Run: npm run dev"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo "🔧 For Supabase Storage setup, see STORAGE_SETUP.md"
