#!/bin/bash

# TikTok Discovery Dashboard - Development Environment Setup
# This script initializes the development environment and starts the application

set -e

echo "=========================================="
echo "TikTok Discovery Dashboard - Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}npm version: $(npm -v)${NC}"

# Check for .env.local file
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Warning: .env.local file not found.${NC}"
    echo "Creating .env.local.example template..."
    cat > .env.local.example << 'EOF'
# Apify API Token for TikTok scraping
APIFY_TOKEN=your_apify_token_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
EOF
    echo -e "${YELLOW}Please copy .env.local.example to .env.local and fill in your credentials.${NC}"
    echo ""
    echo "Required environment variables:"
    echo "  - APIFY_TOKEN: Your Apify API token"
    echo "  - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key"
    echo "  - SUPABASE_SERVICE_KEY: Supabase service role key"
    echo ""
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies.${NC}"
    exit 1
fi

echo -e "${GREEN}Dependencies installed successfully!${NC}"

# Run database migrations (if applicable)
# Note: Supabase handles migrations through their dashboard/CLI
echo ""
echo "Note: Database migrations should be run via Supabase Dashboard or CLI."
echo "Ensure your Supabase project has the following tables:"
echo "  - brands"
echo "  - competitor_accounts"
echo "  - videos"
echo "  - scrape_jobs"
echo ""

# Start development server
echo "=========================================="
echo "Starting development server..."
echo "=========================================="
echo ""
echo -e "${GREEN}The application will be available at:${NC}"
echo "  Local:    http://localhost:3000"
echo ""
echo "Dashboard: http://localhost:3000"
echo "Manage:    http://localhost:3000/manage"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

npm run dev
