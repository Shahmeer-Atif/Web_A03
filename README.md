# Property Dealer CRM

A full-stack lead management system for property dealers built with Next.js 16, MongoDB Atlas, and Socket.io.

## Features

- **Role-based access** — Admin and Agent roles with middleware-enforced routing
- **Lead management** — Create, edit, delete, filter, and paginate leads with automatic priority scoring
- **Lead scoring** — Budget × source weight + status bonus, recalculated on every save
- **Assignment** — Admin assigns/reassigns leads to agents; email notification sent on assignment
- **Follow-up reminders** — Overdue and stale lead banners on dashboards
- **Activity timeline** — Append-only audit log on every lead (status changes, assignments, follow-ups)
- **Real-time updates** — Socket.io broadcasts lead events; polling fallback if socket unavailable
- **Analytics dashboard** — Recharts donut + bar charts, agent performance table with conversion rates
- **Rate limiting** — Token-bucket limiter (50 req/min agents, 1000 req/min admins)
- **Email notifications** — Nodemailer on lead creation and assignment (graceful no-op without SMTP)
- **Responsive UI** — Mobile hamburger nav, loading skeletons, empty states, toast notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| Database | MongoDB Atlas + Mongoose 9 |
| Auth | NextAuth v5 (JWT strategy) |
| Validation | Zod v4 |
| Real-time | Socket.io v4 (standalone server) |
| Charts | Recharts |
| Email | Nodemailer |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form |

## Local Setup

### Prerequisites

- Node.js 20+
- MongoDB Atlas cluster (or local MongoDB)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/property_crm
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

SEED_ADMIN_EMAIL=admin@crm.local
SEED_ADMIN_PASSWORD=Admin123!
SEED_ADMIN_NAME=Site Admin

NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
SOCKET_PORT=4000

# Optional — app works without these
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### 3. Seed the admin account

```bash
npm run seed
```

### 4. Run the development servers

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Socket.io (optional, app polls without it)
npm run socket
```

App runs at [http://localhost:3000](http://localhost:3000).

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@crm.local` | `Admin123!` |

Create agent accounts from **Admin → Agents** after logging in.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login / register pages
│   ├── (dashboard)/      # Admin + Agent dashboard pages
│   │   ├── admin/        # leads, agents, analytics
│   │   └── agent/        # My Leads
│   └── api/              # REST API routes
├── components/
│   ├── analytics/        # AnalyticsDashboard (Recharts)
│   ├── leads/            # LeadTable, LeadForm, AssignAgent, etc.
│   ├── shared/           # SessionProvider, SignOutButton, LeadEventRefresher
│   └── ui/               # Skeleton components
├── hooks/
│   └── useLeadEvents.ts  # Socket.io + polling fallback
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Mongoose connection (globalThis cache)
│   ├── emitEvent.ts      # Fire-and-forget socket emit
│   ├── rateLimit.ts      # Token-bucket rate limiter
│   ├── requireUser.ts    # Auth + RBAC + rate limit helper
│   └── email/            # Nodemailer mailer + templates
├── models/               # Mongoose models (User, Lead, Activity)
└── proxy.ts              # Next.js middleware (auth guard)
server/
└── socket-server.ts      # Standalone Socket.io server
scripts/
└── seed.ts               # Admin account seeder
```

## Deployment

### Next.js → Vercel

1. Push repo to GitHub
2. Import in [vercel.com](https://vercel.com) → New Project
3. Add all env vars from the table above
4. Deploy

### Socket.io Server → Railway

1. New Railway project → connect the same repo
2. Set start command: `npm run socket`
3. Set `SOCKET_PORT=8080` (Railway uses port 8080 by default or injects `$PORT`)
4. Copy the public Railway URL into Vercel's `NEXT_PUBLIC_SOCKET_URL`

> The socket server is optional — the app automatically falls back to polling every 3 seconds if unreachable.

### Production env checklist

- [ ] `MONGODB_URI` — Atlas with IP allowlist `0.0.0.0/0`
- [ ] `NEXTAUTH_SECRET` — strong random value
- [ ] `NEXTAUTH_URL` — your Vercel domain (`https://your-app.vercel.app`)
- [ ] `NEXT_PUBLIC_SOCKET_URL` — Railway socket server URL
- [ ] `SMTP_*` — optional for email notifications
