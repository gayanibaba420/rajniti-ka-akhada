# राजनीति का अखाड़ा — Production CMS

Hindi news portal with PostgreSQL, JWT auth, full CMS, and DB-backed public pages.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- JWT session auth (httpOnly cookies, bcrypt passwords)
- Local/S3/Cloudinary storage abstraction for media

## Local development

**Requirements:** Node.js 20.9+, PostgreSQL 16+

```bash
npm ci
cp .env.example .env
# Edit DATABASE_URL, AUTH_SECRET (min 32 chars), NEXT_PUBLIC_SITE_URL

npm run db:setup   # migrate + seed DEMO data
npm run dev -- --hostname 0.0.0.0 --port 43127
```

Open http://localhost:43127

### Seed credentials (DEMO)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rajnitikaakhada.in | Admin@12345 |
| Editor | editor@rajnitikaakhada.in | Editor@12345 |
| Author | author@rajnitikaakhada.in | Author@12345 |

## Environment variables

See `.env.example` for all variable names. Never commit secrets.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `AUTH_SECRET` | Yes | JWT signing (32+ chars) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical URL, sitemap, RSS |
| `STORAGE_PROVIDER` | Yes | `local`, `s3`, or `cloudinary` |
| `STORAGE_LOCAL_PATH` | local | Upload directory (default `./uploads`) |
| `CRON_SECRET` | Yes | Protects `/api/cron/publish` |
| AWS / Cloudinary vars | s3/cloudinary | Media upload in production |

## CMS (`/admin`)

- Login required (middleware + API protection)
- Articles: create/edit/publish/draft/schedule/feature/breaking/trending
- Media library with local upload (S3/Cloudinary when configured)
- Breaking news, ads, comments moderation, analytics, SEO settings

## Scheduled publishing

Call `GET` or `POST` `/api/cron/publish` with header:

```
Authorization: Bearer <CRON_SECRET>
```

Configure Vercel Cron or external scheduler every 1–5 minutes.

## Production deployment

1. **PostgreSQL** — Create database (Neon, Supabase, RDS, etc.)
2. **Set env vars** on host (Vercel/Railway/VPS)
3. **Run migrations:** `npx prisma migrate deploy`
4. **Seed (optional):** `npm run db:seed`
5. **Build:** `npm run build && npm start`
6. **Cron:** Schedule `/api/cron/publish`
7. **Domain:** Point DNS → set `NEXT_PUBLIC_SITE_URL=https://your-domain.in`
8. **Storage:** For production, set `STORAGE_PROVIDER=s3` or `cloudinary` with credentials

### Media storage (production)

**S3:** Set `STORAGE_PROVIDER=s3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION`

**Cloudinary:** Set `STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Without credentials, uploads return 503 with a clear message — no fake uploads.

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
npm run db:migrate
npm run db:seed
```
