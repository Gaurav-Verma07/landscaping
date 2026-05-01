# Marketing Module — Setup & Feature Guide

Complete documentation for the Marketing module. Update this file as new features are integrated.

---

## Overview

The marketing module gives landscaping companies a full set of tools to attract new clients, re-engage existing ones, and automate outreach — all built on top of the platform's existing SMTP email infrastructure, CRM customer data, and outreach prospect pipeline.

---

## Features

### Campaign Builder
Create and send email campaigns to customers and prospects.

- **Audience types:** All customers, active customers, past customers, leads, all prospects, contacted prospects, responded prospects
- **One-off send** — send immediately on creation
- **Scheduled send** — pick a date and time, campaign sends automatically
- **Draft** — save without sending
- **Send log** — view per-recipient delivery status, timestamp, and error for every sent campaign

### AI Copy Generation
Generate campaign subject lines and body copy using Claude AI.

- Describe your campaign in plain English
- Claude generates a professional subject + body in seconds
- Uses `{{contact_name}}` placeholder for personalisation
- Powered by the Anthropic API (claude-sonnet-4-20250514)

### Seasonal Templates
8 pre-written campaign templates ready to use in one click.

| Template | Season | Audience |
|---|---|---|
| Spring cleanup | Spring | Past customers |
| Summer maintenance | Summer | Active customers |
| Autumn leaf clearance | Autumn | All customers |
| Winter garden prep | Winter | All customers |
| Storm clearance | Storm | All customers |
| Win back past clients | Year-round | Past customers |
| Referral request | Year-round | Active customers |
| Prospect introduction | Year-round | All prospects |

Applying a template pre-fills the campaign name, subject, body, and audience. All content is fully editable before sending.

### Scheduled Campaigns (cron-job.org)
Campaigns with a future `scheduled_at` date are processed automatically every 15 minutes via a cron job.

**Status flow:**
```
draft → scheduled → sending → sent / failed
```

**How it works:**
1. User schedules a campaign with a date and time
2. Campaign saved to Supabase with `status: 'scheduled'`
3. cron-job.org pings `/api/cron/campaigns` every 15 minutes
4. Route finds campaigns where `scheduled_at <= now()` and `status = 'scheduled'`
5. Emails sent via the company's SMTP config
6. Campaign updated to `sent` or `failed` with per-recipient logs

---

## Database Tables

```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_type TEXT NOT NULL DEFAULT 'all_customers',
  audience_filters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-send log
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

Run migrations in Supabase SQL Editor if not already applied.

---

## Environment Variables

```env
# Required for AI copy generation
# Already set if using Claude API elsewhere in the platform

# Required for scheduled campaigns (generate with: openssl rand -hex 32)
CRON_SECRET=your-random-secret-here
```

Add `CRON_SECRET` to both `.env.local` and your Vercel environment variables.

---

## Scheduled Campaigns Setup (cron-job.org)

This is a **one-time manual setup** required for scheduled campaigns to work in production.

### Prerequisites
- App deployed to Vercel (scheduled campaigns require a public URL)
- `CRON_SECRET` added to Vercel environment variables

### Steps

**1. Generate a secret**
```bash
openssl rand -hex 32
```
Add this value as `CRON_SECRET` in `.env.local` and Vercel env vars.

**2. Create a cron-job.org account**
Go to [cron-job.org](https://cron-job.org) and sign up for free.

**3. Create the cron job**
Dashboard → Cron Jobs → Create cron job

| Field | Value |
|---|---|
| Title | Process scheduled campaigns |
| URL | `https://your-app.vercel.app/api/cron/campaigns` |
| Schedule | Every 15 minutes |
| Request method | POST |
| Header key | `x-cron-secret` |
| Header value | Your `CRON_SECRET` value |

Click Save and enable the job.

**4. Test it**
Visit in browser (GET also works):
```
https://your-app.vercel.app/api/cron/campaigns
```
Expected response:
```json
{ "processed": 0, "message": "No campaigns due" }
```

**5. Monitor**
In cron-job.org dashboard → your job → History tab shows every execution and its response code.

### Local testing
While developing locally, manually trigger the route at any time:
```
http://localhost:3000/api/cron/campaigns
```
Any campaigns with `scheduled_at <= now()` will be processed immediately.

---

## Email Sending (SMTP)

All campaign emails are sent using each company's own SMTP credentials — no shared platform email or domain required.

**Configure in:** Dashboard → Settings → Email configuration

| Provider | Host | Port |
|---|---|---|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |
| Custom | your mail server | 587 or 465 |

For Gmail: use an App Password (Google Account → Security → App Passwords), not your regular password.

Campaigns will silently skip sending if SMTP is not configured.

---

## File Structure

```
src/
├── app/
│   ├── api/cron/campaigns/route.ts     — scheduled campaign processor
│   └── dashboard/marketing/page.tsx    — marketing page
├── components/dashboard/marketing/
│   ├── marketing-workspace.tsx         — main layout
│   ├── marketing-stats.tsx             — 4 stat cards
│   ├── campaign-builder-dialog.tsx     — create/edit with AI + templates + scheduling
│   ├── campaign-table.tsx              — campaign list with actions
│   └── campaign-sends-dialog.tsx       — per-campaign send log
└── lib/
    ├── marketing-types.ts              — TypeScript types
    ├── marketing-store.tsx             — client store + provider
    ├── marketing-templates.ts          — 8 seasonal templates
    └── actions/marketing.ts            — server actions (CRUD + send)
```

---

## Planned Features (Phase 2)

| Feature | Description |
|---|---|
| Seasonal auto-campaigns | Trigger campaigns automatically on a fixed calendar date each year |
| Lead magnets | Free quote landing page and seasonal checklist downloads |
| Referral program | Unique referral link per customer, discount on successful referral |
| ROI tracking | Jobs booked within 30 days of a campaign, revenue attributed per send |
| Open tracking | Switch to Brevo API (free, 300/day) for open rate and click data |
| Review requests | Auto-email customers a Google review link when invoice is fully paid |

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Campaign stuck in `scheduled` | cron-job.org not set up | Register job on cron-job.org or trigger `/api/cron/campaigns` manually |
| Emails not sending | SMTP not configured | Go to Settings → Email configuration and test connection |
| AI generation fails | Anthropic API error | Check browser console for error detail, try again |
| `0 recipients` on send | No emails in audience | Check customer/prospect records have email addresses |
| Cron route returns 401 | Wrong or missing secret | Check `CRON_SECRET` matches in env and cron-job.org header |