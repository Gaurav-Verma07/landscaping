# Landscaping Operations & AI Office Platform

AI-powered landscaping business management software. CRM, project management, quoting, invoicing, scheduling, crew, equipment, communications, and AI office assistant.

## Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Database:** Supabase (Postgres + Auth + Storage)
- **UI:** Tailwind CSS 4, Radix UI, shadcn-style components
- **Voice/agent:** ElevenLabs (optional)
- **Package manager:** Bun

## Prerequisites

- [Bun](https://bun.sh)
- Node 20+
- [Supabase](https://supabase.com) account
- [Supabase CLI](https://github.com/supabase/cli)

## Setup

1. **Clone and install**

   ```bash
   bun install
   ```

2. **Create a Supabase project**

   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to finish provisioning
   - Go to **Project Settings → API** and copy:
     - `Project URL`
     - `anon public` key
     - `service_role` key

3. **Environment variables**

   Create `.env.local` in the project root:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   COMPANIES_HOUSE_API_KEY=companies-house-api-key
   GEOAPIFY_API_KEY=geoapify-api-key
   CRON_SECRET=a-random-strong-password

   # ElevenLabs (optional, for voice/agent features)
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id
   ```

   > For lead generation API setup instructions, see [lead_readMe.md](./docs/lead_readMe.md)


4. **Install Supabase CLI**

   ```bash
   # macOS / Linux via Homebrew
   brew install supabase/tap/supabase

   # or via npm
   npm i supabase --save-dev
   ```

5. **Run database migrations**

   Link to your Supabase project and push the schema:

   ```bash
   # Link your project
   # Get your project-ref from your Supabase dashboard URL:
   # https://supabase.com/dashboard/project/YOUR_PROJECT_REF
   supabase link --project-ref your-project-ref

   # Push all migrations (creates all tables, RLS policies, functions and triggers)
   supabase db push
   ```

6. **Create storage buckets**

   In Supabase Dashboard → Storage, create three **public** buckets:
   - `attachments` — customer file attachments
   - `documents` — project documents
   - `team-logos` — company/team logos

7. **Run the app**

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   On first run, sign up with your email to create an account. The profile is auto-created via a database trigger.

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
- `src/lib/actions` – Supabase server actions (CRUD per module)
- `src/lib/supabase` – Supabase client, server, and middleware config
- `src/lib/*-store.tsx` – Client-side data stores (lazy loaded per page)
- `src/lib/elevenlabs` – ElevenLabs config
- `supabase/migrations` – Database migrations

## Dashboard modules

- **Customers** – CRM, notes, timeline, attachments
- **Projects** – Project management, timeline milestones, supervisor reports
- **Quotes & Invoicing** – Quotes, contracts, invoices, suppliers, materials
- **Appointments** – Calendar, scheduling, crew assignment
- **Crew & Labor** – Employee management, GPS time tracking
- **Equipment** – Asset registry, booking, maintenance
- **Communications** – Email, SMS, automation rules, follow-up sequences
- **Documents** – Per-customer and per-project file vault
- **Outreach** – Lead generation and prospect pipeline
- **Admin & Audit** – Audit log, user activity

## Deploy

Deploy to Vercel and set the following environment variables in your deployment settings:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=  # optional
```

Then run migrations against your production Supabase project:

```bash
supabase link --project-ref your-production-project-ref
supabase db push
```
## Deploy

Build and run in production:

```powershell
bun run build
bun run start
```
