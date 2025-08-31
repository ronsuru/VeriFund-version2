# Verifund Development Environment Setup Script (Windows PowerShell)
# This script sets up the local development environment

Write-Host "🚀 Setting up Verifund Development Environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeMajorVersion = (node --version).Split('v')[1].Split('.')[0]
if ([int]$nodeMajorVersion -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $(node --version)" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Create environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "🔧 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your actual values:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor White
    Write-Host "   - SESSION_SECRET (random string for session encryption)" -ForegroundColor White
    Write-Host "   - Other service keys as needed" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Your Supabase credentials are already configured!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if Docker is available for optional containerized setup
try {
    $dockerVersion = docker --version
    $dockerComposeVersion = docker-compose --version
    Write-Host "🐳 Docker detected - you can use containerized development:" -ForegroundColor Green
    Write-Host "   docker-compose up -d    # Start PostgreSQL + Redis" -ForegroundColor White
    Write-Host "   docker-compose up app   # Start app with hot reload" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "💡 Consider installing Docker for containerized development" -ForegroundColor Yellow
}

# Check if PostgreSQL is available locally
try {
    $psqlVersion = psql --version
    Write-Host "🐘 PostgreSQL detected locally" -ForegroundColor Green
    Write-Host "   You can create a local database or use Supabase" -ForegroundColor White
} catch {
    Write-Host "💡 Consider using Supabase for database or install PostgreSQL locally" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Set up Supabase project (see README.md)" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed setup instructions, see README.md" -ForegroundColor Cyan
Write-Host "🔧 For Supabase Storage setup, see STORAGE_SETUP.md" -ForegroundColor Cyan
