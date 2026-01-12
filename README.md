# DoNotStay

AI-powered hotel review analysis for Booking.com. Get instant verdicts on whether to book.

## Project Structure

```
donotstay/
├── packages/
│   └── shared/           # Shared types and utilities
├── apps/
│   ├── web/              # Next.js web app + API (Vercel)
│   └── extension/        # Chrome Extension (Manifest V3)
└── supabase/
    └── migrations/       # Database schema
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- Anthropic API key
- Stripe account (for payments)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and keys from Settings > API

### 3. Configure Environment Variables

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
ANTHROPIC_API_KEY=sk-ant-xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Stripe (for payments)

1. Create products in Stripe Dashboard:
   - Monthly: $5/month
   - Annual: $50/year
2. Copy the price IDs to your `.env.local`
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`

### 5. Run Development Servers

```bash
# Run web app
pnpm dev:web

# Build extension (in another terminal)
pnpm dev:extension
```

### 6. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist`

## Development

### Web (Next.js)

```bash
cd apps/web
pnpm dev
```

Runs at `http://localhost:3000`

### Extension

```bash
cd apps/extension
pnpm dev
```

Watches for changes and rebuilds to `dist/`.

### Shared Package

```bash
cd packages/shared
pnpm dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze hotel reviews |
| `/api/user` | GET | Get current user & subscription |
| `/api/auth/magic-link` | POST | Send magic link email |
| `/api/auth/verify` | GET | Verify magic link token |
| `/api/feedback` | POST | Submit verdict feedback |
| `/api/stripe/create-checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |

## Deployment

### Web (Vercel)

```bash
cd apps/web
vercel deploy
```

### Extension (Chrome Web Store)

1. Build for production:
   ```bash
   cd apps/extension
   pnpm build
   ```
2. Zip the `dist` folder
3. Submit to Chrome Web Store

## Features

- **Verdict System**: Stay / Questionable / Do Not Stay
- **Confidence Score**: 0-100 based on review analysis
- **Red Flags**: Critical issues with evidence
- **Avoid If Personas**: Who should avoid this hotel
- **Rate Limiting**: Free tier (2 checks/hour), Pro (unlimited)
- **Caching**: 7-day verdict cache to reduce API costs

## Tech Stack

- **Extension**: Chrome Manifest V3, React, Vite
- **API**: Next.js 15, TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude claude-sonnet-4-20250514
- **Payments**: Stripe
- **Auth**: Supabase Auth (Magic Link)

## License

MIT
