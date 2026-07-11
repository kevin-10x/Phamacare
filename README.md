# PharmaCare — Pharmacy E-Commerce Platform

A working foundation for a Kenyan pharmacy e-commerce platform, built entirely on
Cloudflare's stack so it deploys with no separate servers to manage:

- **Frontend** — React + TypeScript + Tailwind, deployed to **Cloudflare Pages**
- **Backend** — Hono API running on **Cloudflare Workers**
- **Database** — **Cloudflare D1** (SQLite at the edge): medicines, categories, users, orders, prescriptions
- **File storage** — **Cloudflare R2**: uploaded prescription images/PDFs
- **Auth** — JWT, PBKDF2 password hashing (Web Crypto, no native deps)
- **Payments** — order flow wired up, with an M-Pesa Daraja STK-push stub ready
  for your real credentials (`backend/src/mpesa.ts`)

## What's actually implemented

The original brief listed several hundred features (AI symptom checkers, telemedicine
video calls, multi-branch SaaS, native mobile apps, etc.). That's a multi-team,
multi-year product — no single build produces all of it responsibly. What's here is a
real, deployable MVP covering the core commerce and compliance loop, architected so
every other feature on your list has an obvious home to be added later:

**Built now:**
- Product catalog with categories, search, product detail pages
- Cart, checkout, and order history
- Prescription upload (to R2) + pharmacist approval queue
- Customer / Pharmacist / Admin dashboards with role-based access
- JWT auth (register/login), M-Pesa order flow scaffolding
- Admin: revenue/orders/customers stats, low-stock alerts, order status management

**Scaffolded for you to extend:** AI features, telemedicine, multi-branch inventory,
loyalty/marketing automation, native apps, and everything else in the "Advanced
Features" list — each maps cleanly onto a new route in `backend/src/index.ts` and a
new table in `migrations/`.

## Project structure

```
pharmacare/
├── backend/            Cloudflare Worker API (Hono)
│   ├── src/index.ts    All API routes
│   ├── src/auth.ts     JWT + password hashing
│   ├── src/mpesa.ts    M-Pesa Daraja stub
│   ├── migrations/     D1 schema + seed data
│   └── wrangler.toml
└── frontend/            React app (Cloudflare Pages)
    ├── src/pages/       Home, Shop, Product, Cart, Checkout, Dashboards…
    ├── src/context/     Auth + Cart state
    └── wrangler.toml not needed — deployed via `wrangler pages deploy`
```

## Prerequisites

- Node.js 18+
- A free Cloudflare account
- `npm install -g wrangler` (or use `npx wrangler`)
- `wrangler login`

## 1. Deploy the backend (Cloudflare Workers + D1 + R2)

```bash
cd backend
npm install

# Create the D1 database, then copy the returned database_id into wrangler.toml
wrangler d1 create pharmacare-db

# Create the R2 bucket for prescription uploads
wrangler r2 bucket create pharmacare-prescriptions

# Run the schema + seed data against your new database
npm run db:migrate:remote
npm run db:seed:remote

# Set your JWT signing secret (any long random string)
wrangler secret put JWT_SECRET

# Deploy the API
npm run deploy
```

Wrangler will print your live API URL, e.g.
`https://pharmacare-api.<your-subdomain>.workers.dev`.

To promote a user to `admin` or `pharmacist` after they register, run:

```bash
wrangler d1 execute pharmacare-db --remote \
  --command "UPDATE users SET role='admin' WHERE email='you@example.com'"
```

## 2. Deploy the frontend (Cloudflare Pages)

```bash
cd frontend
npm install
cp .env.example .env
# edit .env and set VITE_API_URL to the Worker URL from step 1

npm run build
wrangler pages deploy dist --project-name=pharmacare-web
```

Or connect the `frontend/` folder to Cloudflare Pages via the dashboard for
automatic deploys on every git push (Build command: `npm run build`,
Build output directory: `dist`, and add `VITE_API_URL` as an environment variable
in the Pages project settings).

## 3. Local development

```bash
# Terminal 1 — API
cd backend && npm install && wrangler dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8787` automatically
(see `frontend/vite.config.ts`).

## Wiring up real M-Pesa payments

`backend/src/mpesa.ts` contains a working Safaricom Daraja STK-push request.
Get sandbox credentials at https://developer.safaricom.co.ke, set them with
`wrangler secret put MPESA_CONSUMER_KEY` (and the other `MPESA_*` secrets), then
call `stkPush()` from the `/api/orders` route in `index.ts` when
`paymentMethod === 'mpesa'`, and add a callback route to receive Safaricom's
payment confirmation webhook.

## Regulatory note

This is a technical scaffold, not legal advice. Before going live in Kenya, confirm
your platform's compliance with the Pharmacy and Poisons Board (PPB) requirements
for online pharmacies, prescription verification, and controlled substances.
