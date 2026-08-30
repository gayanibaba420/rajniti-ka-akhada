# राजनीति का अखाड़ा — Option C Architecture

Hindi news portal with **separated frontend (Vercel) and backend (AWS EC2)**.

| Layer | Host | Stack |
|-------|------|-------|
| **Frontend** | Vercel — `https://www.rajnitikaakhada.com` | Next.js App Router, SSR/SEO pages |
| **Backend API** | AWS EC2 — `https://api.rajnitikaakhada.com` | Express + TypeScript + Prisma + PostgreSQL |

## Folder structure

```
/
├── backend/                 # Standalone API server (EC2)
│   ├── src/
│   │   ├── index.ts         # Entry point (PORT 4000)
│   │   ├── app.ts           # Express app + CORS
│   │   ├── lib/             # Prisma, auth, articles, Facebook, Cloudinary
│   │   ├── middleware/      # JWT auth middleware
│   │   └── routes/          # auth, public, admin, cron
│   ├── prisma/              # Schema + migrations
│   ├── Dockerfile
│   ├── deploy-ec2.sh
│   └── .env.example
├── src/                     # Next.js frontend (Vercel)
│   ├── app/                 # Pages, SEO (sitemap, robots, RSS)
│   ├── components/
│   └── lib/
│       ├── api-client.ts    # Fetches from NEXT_PUBLIC_API_URL
│       ├── articles.ts      # Re-exports API client helpers
│       └── types.ts
├── prisma/                  # Legacy schema reference
├── .env.example             # Frontend env vars
└── package.json
```

## Local development

**Terminal 1 — Backend (port 4000):**

```bash
cd backend
cp .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

**Terminal 2 — Frontend (port 3000):**

```bash
cp .env.example .env
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in frontend `.env`.

### Seed credentials (DEMO)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rajnitikaakhada.in | Admin@12345 |
| Editor | editor@rajnitikaakhada.in | Editor@12345 |
| Author | author@rajnitikaakhada.in | Author@12345 |

## Frontend — Vercel deploy

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.rajnitikaakhada.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.rajnitikaakhada.com` |

## Google Analytics 4 (GA4)

Traffic is tracked with GA4 when `NEXT_PUBLIC_GA_ID` is set. The measurement ID is **not** stored in admin site settings — use the Vercel environment variable only.

### 1. Create a GA4 property (Google Analytics)

1. Open [Google Analytics](https://analytics.google.com/) → **Admin** (gear icon).
2. **Create property** (or use an existing one) for `rajnitikaakhada.com`.
3. Under **Data streams** → **Web**, add stream URL `https://www.rajnitikaakhada.com`.
4. Copy the **Measurement ID** (format `G-XXXXXXXXXX`).

### 2. Set env var in Vercel

1. Vercel project → **Settings** → **Environment Variables**.
2. Add `NEXT_PUBLIC_GA_ID` = your `G-XXXXXXXXXX` ID for **Production** (and Preview if desired).
3. **Redeploy** the frontend so the build picks up the variable.

### 3. Cookie consent

A Hindi cookie banner appears until the visitor clicks **स्वीकार करें**. GA4 scripts load only after consent (stored in `localStorage`). If `NEXT_PUBLIC_GA_ID` is unset, the banner and analytics are skipped entirely.

Admin **Google Search Console** verification (`gsc_verification` in site settings) is separate from GA4 and unchanged.

## Backend — EC2 manual setup

See `backend/.env.example` for all variables. Summary:

1. Ubuntu 22.04 + Node 22 + PM2 + Nginx
2. Clone repo → `backend/` → `npm ci && npm run db:migrate && npm run build`
3. `pm2 start dist/index.js --name rajniti-api`
4. Nginx proxy `api.rajnitikaakhada.com` → `127.0.0.1:4000`
5. Certbot SSL for API subdomain
6. Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://api.rajnitikaakhada.com/api/cron/publish`

Health: `GET /health`

## AI News Radar

Safe AI-assisted Hindi news drafting with **manual approval required by default**. AI never auto-publishes.

### Environment variables (server-side only)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for Hindi draft generation |
| `GNEWS_API_KEY` | GNews.io API key for news fetching (optional if using RSS) |
| `CRON_SECRET` | Bearer token for scheduled fetch (`/api/cron/ai-radar`) |

Set these in Vercel project settings or `.env` — **never** in `NEXT_PUBLIC_*` vars.

### Admin usage

1. Log in to `/admin` → sidebar **AI News Radar**
2. Configure settings (categories, fetch interval, min confidence, manual approval)
3. Click **खबरें लाएं** to fetch news from GNews/RSS
4. Click **AI ड्राफ्ट बनाएं** to generate Hindi drafts via Gemini
5. Review drafts — verify facts, edit if needed, select featured image from Media library
6. Click **प्रकाशित** only after confirming: *"AI generated content — Please verify facts before publishing."*
7. Approved content publishes as a regular `Article` with full SEO metadata

### Cron schedule

On **Vercel Hobby**, cron jobs are limited to once per day. `vercel.json` runs `/api/cron/ai-radar` daily at 01:30 UTC (`30 1 * * *`; publish cron is midnight UTC). On Pro/Enterprise you can use a tighter schedule (e.g. every 45 minutes).

Admins can trigger a fetch anytime from **AI News Radar** → **खबरें लाएं** (Fetch News Now); the cron is only for unattended runs.

Manual/cron trigger requires `CRON_SECRET` header:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.rajnitikaakhada.com/api/cron/ai-radar
```

### Limitations

- No auto-download of copyrighted source images (stores `imagePrompt` only)
- Gemini/GNews free-tier rate limits apply — errors shown in admin activity log
- Duplicate detection by URL and title similarity; not 100% foolproof
- RSS sources can be added via database `AiNewsSource` records (type `RSS`)
