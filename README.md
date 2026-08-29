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

## Backend — EC2 manual setup

See `backend/.env.example` for all variables. Summary:

1. Ubuntu 22.04 + Node 22 + PM2 + Nginx
2. Clone repo → `backend/` → `npm ci && npm run db:migrate && npm run build`
3. `pm2 start dist/index.js --name rajniti-api`
4. Nginx proxy `api.rajnitikaakhada.com` → `127.0.0.1:4000`
5. Certbot SSL for API subdomain
6. Cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://api.rajnitikaakhada.com/api/cron/publish`

Health: `GET /health`
