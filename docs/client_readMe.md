# 🌿 landscaping Landscaping Platform — Client Setup & Feature Guide

> Complete onboarding reference for setup, features, and known edge cases.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Supabase Setup](#3-supabase-setup)
4. [Running the App](#4-running-the-app)
5. [First Login & Onboarding](#5-first-login--onboarding)
6. [Email (SMTP) Configuration](#6-email-smtp-configuration)
7. [AI Assistant Setup](#7-ai-assistant-setup)
8. [Scheduled Campaigns (Cron)](#8-scheduled-campaigns-cron)
9. [Lead Generation Setup](#9-lead-generation-setup)
10. [GPS Crew Tracking](#10-gps-crew-tracking)
11. [Module Feature Reference](#11-module-feature-reference)
12. [Known Edge Cases & Gotchas](#12-known-edge-cases--gotchas)
13. [What's Not Yet Built](#13-whats-not-yet-built)

---

## 1. Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| Bun | Latest (`npm install -g bun`) |
| Supabase account | [supabase.com](https://supabase.com) — free tier is fine |
| Git | Any recent version |

---

## 2. Environment Variables

Create a `.env.local` file in the project root. Copy from `.env.example` and fill in each value:

```env
# ── Supabase ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key   # same as anon key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# ── Lead Generation (optional but recommended) ────────────────────────
COMPANIES_HOUSE_API_KEY=your-key          # UK company search — free at developer.company-information.service.gov.uk
GEOAPIFY_API_KEY=your-key                 # Place search — free tier at geoapify.com

# ── Cron (required for scheduled marketing campaigns) ─────────────────
CRON_SECRET=your-random-secret            # generate: openssl rand -hex 32

# ── AI Assistant (pick one provider) ─────────────────────────────────
AI_PROVIDER=anthropic                     # anthropic | openai | gemini
AI_MODE=production                        # production | demo

ANTHROPIC_API_KEY=sk-ant-...             # claude.ai account does NOT include API access
OPENAI_API_KEY=sk-...                    # platform.openai.com
GEMINI_API_KEY=AIza...                   # aistudio.google.com (free tier available)
```

> **Important:** `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secret keys in `NEXT_PUBLIC_` variables.

---

## 3. Supabase Setup

### 3.1 Create a project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon/public key** from Settings → API

### 3.2 Run migrations
Open the **SQL Editor** in Supabase and run the migration files in order from the `supabase/migrations/` folder in the repo. This creates all tables, RLS policies, and indexes.

If there is a `design-migration.sql` file in the repo, run that separately — it covers the landscape design canvas tables.

### 3.3 Enable Auth providers
Go to **Authentication → Providers**:
- **Email** — enabled by default, no changes needed
- **Google** (optional) — enable, add your Google OAuth client ID and secret. Set the redirect URL to: `https://your-app.vercel.app/auth/callback`

### 3.4 Row Level Security
All tables use RLS scoped to `profile_id = auth.uid()`. Each company's data is fully isolated. Do not disable RLS.

### 3.5 Storage buckets
Create a bucket called `documents` (or whatever name the storage actions reference) and set it to private with authenticated access only.

---

## 4. Running the App

```bash
# Install dependencies
bun install

# Start dev server
bun dev
```

App runs at `http://localhost:3000`.

```bash
# Production build
bun run build
bun start
```

**Recommended deployment: Vercel**
- Connect your GitHub repo to Vercel
- Add all `.env.local` variables to Vercel → Settings → Environment Variables
- Deploy

---

## 5. First Login & Onboarding

1. Navigate to `/auth/signup`
2. Enter email and password → you'll be redirected to `/auth/onboarding`
3. Complete the onboarding form: **company name, your name, role**
4. This creates your `profile` record — all data you create is scoped to this profile
5. Go to `/dashboard` — you're in

**Password reset** is available at `/auth/reset-password`. An email is sent with a reset link (requires your Supabase project to have email sending configured — Supabase's built-in SMTP handles this automatically).

---

## 6. Email (SMTP) Configuration

The platform sends emails **from your own email address** — there is no shared platform mailbox.

### Setup
1. Go to **Dashboard → Settings → Email Configuration**
2. Select your provider: Gmail, Outlook, Yahoo, or Custom
3. Enter your email, display name, and password
4. Click **Test connection** — this must pass before Save is enabled
5. Click **Save email settings**

### Gmail specifics
You **must** use an App Password — not your regular Gmail password:
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate password for "Mail"
3. Use the 16-character code as your password in the app

### SMTP reference

| Provider | Host | Port |
|---|---|---|
| Gmail | `smtp.gmail.com` | 587 |
| Outlook / Hotmail | `smtp.office365.com` | 587 |
| Yahoo | `smtp.mail.yahoo.com` | 587 |
| Custom domain | your mail server | 587 or 465 |

> **Edge case:** If test connection passes but emails don't arrive, check your spam folder and confirm your SMTP provider hasn't blocked "less secure app" access.

---

## 7. AI Assistant Setup

### Choosing a provider

| Provider | Cost | Notes |
|---|---|---|
| **Anthropic** | Paid API | Best quality. Requires separate API billing from claude.ai subscription |
| **OpenAI** | Paid API | GPT-4o-mini is cost-effective |
| **Gemini** | Free tier available | Use `gemini-2.5-flash` or `gemini-2.5-flash-lite` — some preview models return 404s |

Set in `.env.local`:
```env
AI_PROVIDER=gemini        # or anthropic or openai
GEMINI_API_KEY=AIza...
```

Only the active provider's API key is required.

### What the AI can do
- **Read**: customers, projects, quotes, invoices, appointments, campaigns, communications
- **Navigate**: open any page by name ("go to invoices")
- **Draft actions**: create campaigns, send messages, update projects — with your approval before anything is committed
- **Fuzzy matching**: say "show me Smith's invoices" — the AI resolves the name to the correct customer UUID automatically

### Using the AI panel
- Click the **AI button** in the top-right header to open the side panel
- Type naturally: "Show me all overdue invoices" / "Draft a follow-up email for Johnson project"
- Actions that write data show an **approval card** — review and confirm before they execute
- The agentic loop is capped at 10 iterations per message to prevent runaway queries

### Edge cases
- If the AI says "Done." without doing anything, the API key for the selected provider is likely missing or invalid
- Gemini free tier has rate limits — if you hit them, switch to `gemini-2.5-flash-lite` or add billing
- The AI has no memory between sessions — each conversation starts fresh

---

## 8. Scheduled Campaigns (Cron)

Marketing campaigns can be scheduled for a future date and sent automatically.

### One-time setup (production only)

**Step 1 — Generate a secret**
```bash
openssl rand -hex 32
```
Add this as `CRON_SECRET` in both `.env.local` and Vercel environment variables.

**Step 2 — Set up cron-job.org**
1. Create a free account at [cron-job.org](https://cron-job.org)
2. Create a new cron job:

| Field | Value |
|---|---|
| URL | `https://your-app.vercel.app/api/cron/campaigns` |
| Schedule | Every 15 minutes |
| Method | POST |
| Header key | `x-cron-secret` |
| Header value | Your `CRON_SECRET` |

3. Save and enable

### Campaign status flow
```
draft → scheduled → sending → sent / failed
```

> **Edge case:** Scheduled campaigns only fire in production (public URL required). In local dev, campaigns with a scheduled time must be sent manually.

---

## 9. Lead Generation Setup

### Companies House (UK business search)
1. Register at [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk) — free
2. Get your API key
3. Add to `.env.local`: `COMPANIES_HOUSE_API_KEY=your-key`
4. Use in **Dashboard → Outreach → Find Leads → Companies House**

### Geoapify (place/business search)
1. Register at [geoapify.com](https://geoapify.com) — free tier: 3,000 requests/day
2. Get your API key
3. Add to `.env.local`: `GEOAPIFY_API_KEY=your-key`
4. Use in **Dashboard → Outreach → Find Leads → Geoapify Places**

### OpenStreetMap (Overpass)
- No API key required — free and built in
- Use in **Dashboard → Outreach → Find Leads → OpenStreetMap**

### Importing leads
1. Search and select results in the Find Leads dialog
2. Click **Import** — selected companies are added as prospects with stage `New`
3. Duplicate entries are automatically skipped

---

## 10. GPS Crew Tracking

GPS tracking requires **no API keys** — it uses the free browser Geolocation API and OpenStreetMap geocoding.

### How clock-in works
1. Crew member clicks **Clock In** in Dashboard → Crew
2. Selects the project they're working on
3. Clicks **Capture my location** — browser requests location permission
4. Location is verified server-side against the project's site coordinates
5. Result shown before confirming: ✅ On site / ❌ Off site / 🟡 No site coords

### Setting site coordinates (3 ways)
- **Manual**: Enter lat/lng in the Project form → Site Location section
- **"Use my location"**: Click the button in the project form while physically at the site
- **Auto-geocode**: On first clock-in, the system geocodes the customer's address automatically and caches it

### GPS badges in Crew Workspace

| Badge | Meaning |
|---|---|
| 🟢 On site | Within the configured radius |
| 🔴 Off site | Outside radius — flagged for review |
| 🟡 Overridden | Supervisor approved the off-site entry |
| ⚪ No GPS | No location captured at clock-in |

### Supervisor overrides
Off-site entries show an **Override** button. Click it, enter a mandatory reason, confirm. The badge updates immediately.

### Configuring the radius
Default is **200 metres**. Change it per-project in the Project form → Site Location → Radius field.

### Edge cases
- If the crew member denies browser location permission, the clock-in still works but records no GPS (shows ⚪ No GPS badge)
- Poor GPS accuracy (indoors, dense urban areas) may result in off-site flags even when on-site — supervisors can override
- Nominatim (the geocoding service) has a 1 request/second rate limit, but coordinates are cached after the first clock-in so this is only a one-time call per project

---

## 11. Module Feature Reference

### CRM — Customers
- Create, edit, merge duplicate customer records
- Full customer timeline: all communications, documents, appointments in one view
- File attachments per customer
- Tags, lead source, status (Lead / Active / Past / Maintenance), review status
- Import customers via CSV

### Appointments
- Book appointments linked to customers and projects
- Assign to specific team members
- Conflict detection built in

### Projects
- Full project lifecycle: Planned → In Progress → Completed
- Timeline engine with milestones (deposit, materials, crew, phases, walkthrough)
- Supervisor daily reports with photo uploads
- Job board Kanban view at `/dashboard/projects/job-board`

### Quotes, Contracts, Invoices
- Create quotes with line items, bulk discounts, quantity tiers
- Accept quote → auto-generates contract
- E-signature on contracts
- Invoice types: deposit, progress, final
- Payment schedules and partial payment recording
- Supplier directory and material catalog

### Communications
- Send emails directly from the platform (requires SMTP setup — see §6)
- Message templates with `{{contact_name}}` placeholder
- Log inbound replies manually
- Automation rules and follow-up sequences
- Full communication history per customer

### Outreach
- Prospect pipeline with stages: New → Contacted → Responded → Qualified → Partner → Archived
- Bulk email sending to multiple prospects
- All sent emails logged automatically in Communications

### Marketing
- Campaign builder with audience targeting (all customers, leads, past customers, prospects, etc.)
- AI-generated subject lines and body copy
- 8 seasonal campaign templates
- Scheduled send via cron (see §8)
- Content calendar view

### Crew & Labor
- Employee directory with roles, skills, certifications
- Clock in/out with GPS verification
- Time logs with date filtering
- Supervisor override for off-site entries

### Equipment
- Equipment registry
- Availability tracking and conflict detection

### Documents
- Per-customer and per-project file vault
- Supports contracts, quotes, invoices, photos, designs, receipts, permits

### Landscape Design Tool
- Canvas editor with photo background upload
- Draw zones (polygons) with fill textures
- Plant library with drag-and-drop placement
- Auto sq-ft calculation per zone
- Export to PNG
- Link design to customer and project records

### Admin & Audit
- Audit logs of all user actions
- Configurable retention settings
- User activity tracking

---

## 12. Known Edge Cases & Gotchas

| Area | Edge Case | How to Handle |
|---|---|---|
| **Email** | Gmail blocks sign-in for "less secure apps" | Use App Password, not your regular password |
| **Email** | Test passes but emails land in spam | Ask recipients to whitelist your sending address |
| **AI** | Says "Done." without acting | Check the API key for your selected `AI_PROVIDER` |
| **AI** | Gemini returns 404 errors | Use `gemini-2.5-flash` not preview model names |
| **AI** | Anthropic API key rejected | claude.ai subscription ≠ API access. Needs separate billing at console.anthropic.com |
| **GPS** | Crew flagged off-site even when on-site | Urban/indoor GPS is imprecise — supervisor override is the intended resolution |
| **GPS** | Location permission denied | Clock-in still works; entry saved with no GPS badge |
| **GPS** | No site coordinates on project | Auto-geocoded from customer address on first clock-in. Ensure customer has a valid address |
| **Campaigns** | Scheduled campaigns not sending | Confirm cron-job.org job is active and `CRON_SECRET` matches in both env and cron header |
| **Campaigns** | Scheduled campaigns work locally | They won't — cron requires a public URL. Test manually in dev |
| **Lead import** | Duplicate prospects | Duplicates are skipped automatically on import |
| **Supabase** | "RLS policy violation" errors | Ensure user is authenticated and `profile_id` exists. Re-run onboarding if missing |
| **Auth** | Google login redirect fails | Confirm redirect URL in Google Console matches exactly: `https://your-app.vercel.app/auth/callback` |
| **Design tool** | Canvas not saving | Check Supabase storage bucket exists and has authenticated read/write access |
| **Quotes** | Quote accepted but no project created | Timeline engine triggers on quote accept — confirm the accept-quote action completes without errors in Supabase logs |

---

## 13. What's Not Yet Built

These items are in the spec but not yet implemented. Set client expectations accordingly:

| Feature | Status | Notes |
|---|---|---|
| **AI inbound call handling** | Not built | ElevenLabs voice exists for navigation only — inbound call-to-AI requires Twilio or similar |
| **SMS channel** | Not built | Platform is email-only today. Twilio integration planned |
| **LinkedIn outreach** | Not built | Prospect pipeline exists; LinkedIn API connection not wired |
| **Receipt OCR / supplier price extraction** | Not built | Manual supplier entry only |
| **Excel data import** | Partial | CSV import works for customers. Project/invoice imports not yet available |
| **Route optimization** | Not built | Marked as future in spec |
| **AI scheduling assistant** | Partial | AI can read appointments; booking via AI not yet available |
| **Review request automation** | Not built | Manual communications only |

---

## Quick Reference — API Keys Needed

| Service | Required For | Where to Get | Cost |
|---|---|---|---|
| Supabase | Everything | supabase.com | Free |
| Anthropic | AI assistant (if using Claude) | console.anthropic.com | Pay-per-use |
| OpenAI | AI assistant (if using GPT) | platform.openai.com | Pay-per-use |
| Google Gemini | AI assistant (if using Gemini) | aistudio.google.com | Free tier |
| Geoapify | Lead search by place | geoapify.com | Free tier (3k/day) |
| Companies House | UK company search | developer.company-information.service.gov.uk | Free |
| cron-job.org | Scheduled campaigns | cron-job.org | Free |

---

*Last updated: April 2026 · landscaping Platform v1*