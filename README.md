# RoofAI

AI-powered roofing management software. Dashboard for estimates, invoices, scheduling, storm-mode deals, and team management.

## Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Database:** Neon (serverless Postgres) + Drizzle ORM
- **UI:** Tailwind CSS 4, Radix UI, shadcn-style components
- **Voice/agent:** ElevenLabs (optional)
- **Package manager:** Bun

## Prerequisites

- [Bun](https://bun.sh)
- Node 20+
- [Neon](https://neon.tech) project (or any Postgres; use Neon connection string)

## Setup

1. **Clone and install**

   ```powershell
   bun install
   ```

2. **Environment variables**

   Create `.env.local` in the project root:

   ```env
   # Neon (or any Postgres connection string)
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

   # ElevenLabs (optional, for voice/agent features)
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id
   ```

   For Neon: create a project at [neon.tech](https://neon.tech), copy the connection string from the dashboard.

3. **Database**

   Create the `users` and `profiles` tables in your Neon DB (see `src/lib/db/schema.ts` for the schema). There is no Drizzle Kit or migrations in this repo; schema is hand-maintained.

4. **Run the app**

   ```powershell
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description        |
|------------------|--------------------|
| `bun run dev`    | Start dev server   |
| `bun run build`  | Production build   |
| `bun run start`  | Run production     |
| `bun run lint`   | Run ESLint         |

## Project structure

- `src/app` – App Router routes (landing, `/auth/*`, `/dashboard/*`)
- `src/components` – UI and dashboard components
- `src/lib/db` – Neon + Drizzle (schema, relations, client)
- `src/lib/elevenlabs` – ElevenLabs config

## Dashboard areas

- **Overview** – Metrics, pipeline chart, jobs table, activity
- **Estimates** – Quick/full estimates, templates
- **Invoices** – Create, status, materials, labor
- **Schedule** – Calendar, weather, assign
- **Storm mode** – Deals, commission, payouts, reps
- **Management** – Settings, integrations, subcontractors, staff, pricing
- **Clients** – Client list
- **Projects** – Project list

## Deploy

Build and run in production:

```powershell
bun run build
bun run start
```

Or deploy to Vercel (or any Node host); set `DATABASE_URL` and optional `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in the deployment environment.
