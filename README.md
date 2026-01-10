# TikTok Discovery Dashboard

A comprehensive TikTok competitor analysis platform that scrapes competitor accounts, tracks video performance metrics (views, comments, shares, saves), and uses AI to analyze WHY content performs well. The dashboard surfaces actionable insights on hooks, formats, emotions, hashtags, and posting times to help users replicate viral content strategies at scale.

## Features

### Core Features (Implemented)
- **Brand Management**: Create, view, switch between, and delete brands
- **Competitor Account Management**: Add single or bulk TikTok accounts with duplicate detection
- **Scraper Integration**: Trigger Apify scraper, track job status, real-time status display
- **Dashboard Widgets**: TopInsightCard, PerformanceSummary, WorkingNowWidget
- **Video Data Display**: List view with metrics (views, comments, shares, saves, virality score)
- **Analytics Library**: Calculate top insights, viral percentages, and group by metrics

### Planned Features
- Comparison Charts (Hook, Format, Emotion, Hashtag performance)
- Trend Analysis (Virality, Engagement, Posting Time)
- Compact Widgets (TopHashtags, PainPoints, TrendingSounds, ContentCalendar)
- Enhanced Video Cards with sparklines
- AI Analysis Engine (auto-tagging, on-demand analysis, pattern synthesis)
- Multi-User SaaS (authentication, user management, data isolation)

## Technology Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, Recharts, date-fns
- **Backend**: Next.js API Routes (serverless), Supabase (PostgreSQL)
- **Scraping**: Apify (apidojo/tiktok-profile-scraper)
- **Deployment**: Vercel (auto-deploy from main branch)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with project
- Apify account with API token
- Vercel account for deployment

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Apify API Token for TikTok scraping
APIFY_TOKEN=your_apify_token_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

## Getting Started

### Quick Start

```bash
# Clone the repository
git clone https://github.com/regreenjr/tiktok-discovery-dashboard.git
cd tiktok-discovery-dashboard

# Run the initialization script
./init.sh
```

### Manual Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

The application will be available at:
- **Dashboard**: http://localhost:3000
- **Manage Page**: http://localhost:3000/manage

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

### brands
- `id` (UUID, primary key)
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- `last_scraped_at` (TIMESTAMPTZ)

### competitor_accounts
- `id` (UUID, primary key)
- `handle` (TEXT, UNIQUE)
- `display_name`, `category`, `notes` (TEXT, nullable)
- `follower_count` (INTEGER, nullable)
- `is_active` (BOOLEAN, default true)
- `brand_id` (UUID, foreign key)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### videos
- `id` (UUID, primary key)
- `account_id` (UUID, foreign key)
- `tiktok_id` (TEXT)
- `description` (TEXT)
- `views`, `comments`, `shares`, `saves` (INTEGER)
- `virality_score` (DECIMAL)
- `hook_type`, `format`, `emotion` (TEXT, nullable)
- `posted_at`, `created_at`, `updated_at` (TIMESTAMPTZ)

### scrape_jobs
- `id` (UUID, primary key)
- `brand_id` (UUID, foreign key)
- `scraper_type` (TEXT)
- `status` (TEXT: pending, running, completed, failed)
- `started_at`, `completed_at` (TIMESTAMPTZ)
- `error_message` (TEXT, nullable)
- `accounts_processed`, `videos_found` (INTEGER)
- `created_at` (TIMESTAMPTZ)

## API Endpoints

### Brands
- `GET /api/brands` - List all brands
- `POST /api/brands` - Create brand
- `DELETE /api/brands/[id]` - Delete brand

### Accounts
- `GET /api/accounts` - List accounts (filter by brand_id)
- `POST /api/accounts` - Create single account
- `POST /api/accounts/bulk` - Bulk create accounts
- `DELETE /api/accounts/[id]` - Delete account

### Scraper
- `POST /api/run-scraper` - Trigger Apify scraper
- `GET /api/scrape-status` - Get scrape job status

### Videos
- `GET /api/videos` - List videos (filter by brand)

## Project Structure

```
/app/
  /api/
    /accounts/       # Account CRUD
    /brands/         # Brand CRUD
    /scrape-status/  # Scrape status
    /run-scraper/    # Trigger scraper
    /videos/         # Video queries
  page.tsx           # Dashboard
  /manage/
    page.tsx         # Manage page

/components/
  ScrapeStatus.tsx
  /dashboard/
    DashboardGrid.tsx
    /widgets/
      TopInsightCard.tsx
      PerformanceSummary.tsx
      WorkingNowWidget.tsx
  /charts/
    SparklineChart.tsx

/lib/
  /analytics/
    insights.ts      # Calculation functions
    types.ts
  /scrapers/
    competitor-monitor.ts
    types.ts
  supabase.ts        # Supabase client
```

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production
npm run build
```

## Deployment

The application is configured for auto-deployment to Vercel from the main branch.

**Production URL**: https://tiktok-discovery-dashboard.vercel.app

## License

Private - All rights reserved
