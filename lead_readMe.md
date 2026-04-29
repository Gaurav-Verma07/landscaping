# Lead Generation & Outreach — Setup Guide

This project supports 3 lead generation sources, a full outreach pipeline, and SMTP-based email sending. Follow the steps below to set up each part.

---

## Lead Generation APIs

### 1. Companies House API (UK Registered Companies)

**What it does:** Search UK registered companies by keyword. Returns company name, address, type, status, and registration number.

**Cost:** Free

**Setup:**

1. Go to [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk)
2. Create an account and sign in
3. Click **Create an application**
4. Choose environment: **Live** (not Test — Test keys don't work against the live API)
5. Choose key type: **REST**
6. Copy the generated API key
7. Add to `.env.local`:

```env
COMPANIES_HOUSE_API_KEY=your-api-key-here
```

> ⚠️ Make sure you select **Live** environment and **REST** key type. Test keys will return 401 Unauthorized.

---

### 2. Geoapify Places API (Local Business Search)

**What it does:** Search businesses by keyword and city. Returns name, address, phone, website, email, and business category. Uses a 10km radius around the specified city.

**Cost:** Free tier — 3,000 requests/day

**Setup:**

1. Go to [geoapify.com](https://geoapify.com)
2. Click **Get Started** and create a free account
3. Go to your [dashboard](https://myprojects.geoapify.com)
4. Create a new project
5. Copy the **API Key**
6. Add to `.env.local`:

```env
GEOAPIFY_API_KEY=your-api-key-here
```

---

### 3. Overpass API (OpenStreetMap)

**What it does:** Search businesses and places from OpenStreetMap by keyword and city. Returns name, address, phone, website, and business type.

**Cost:** Completely free — no API key required

**Setup:**

No setup needed. The API is public and open. Just make sure the app can reach:

```
https://overpass-api.de/api/interpreter
```

> ⚠️ The Overpass public server can sometimes be slow or return 504 timeout errors during peak hours. If this happens, the app automatically tries fallback servers:
> - `https://overpass.kumi.systems/api/interpreter`
> - `https://maps.mail.ru/osm/tools/overpass/api/interpreter`

---

### Final `.env.local` setup

```env
# Companies House (UK registered companies)
COMPANIES_HOUSE_API_KEY=your-key-here

# Geoapify (local business search)
GEOAPIFY_API_KEY=your-key-here

# Overpass (OpenStreetMap) — no key needed
```

---

### How lead import works in the app

1. Go to **Dashboard → Outreach**
2. Click **Find Leads**
3. Select a source from the dropdown:
   - 🏢 **Companies House** — search by company keyword (UK only)
   - 🗺️ **OpenStreetMap** — search by keyword + city
   - 📍 **Geoapify Places** — search by keyword + city (richer data)
4. Search, select results, and click **Import**
5. Selected companies are added to the Outreach prospects table with stage `New`
6. Duplicates are automatically skipped

---

## Email Configuration (SMTP)

Email sending uses each user's own SMTP credentials — no shared platform email or domain required.

**Setup (per user):**

1. Go to **Dashboard → Settings → Email configuration**
2. Select your email provider (Gmail, Outlook, Yahoo, or Custom)
3. Enter your email address, display name, and password
4. For Gmail specifically, use an **App Password** — not your regular Gmail password:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"
   - Use that 16-character password in the app
5. Click **Test connection** — this must pass before Save is enabled
6. Click **Save email settings**

Once configured, outreach emails are sent from your own address and replies go directly to your inbox.

**SMTP settings reference:**

| Provider | Host | Port |
|---|---|---|
| Gmail | `smtp.gmail.com` | 587 |
| Outlook / Hotmail | `smtp.office365.com` | 587 |
| Yahoo | `smtp.mail.yahoo.com` | 587 |
| Custom domain | your mail server | 587 or 465 |

---

## Outreach Pipeline

### Stage reference

| Stage | Description |
|---|---|
| New | Freshly imported or manually created |
| Contacted | Email or SMS sent |
| Responded | Prospect replied (manually logged) |
| Qualified | Vetted and worth pursuing |
| Partner | Converted to customer or active partner |
| Archived | No longer active |

---

### Sending emails

**Single prospect:**
1. Find the prospect in the table
2. Open the row dropdown → **Send Message**
3. Choose Email or SMS channel
4. Optionally select a message template
5. Write subject and message body
6. Click **Send**

**Bulk send:**
1. Select multiple prospects using the checkboxes
2. Click **Send Message** in the bulk toolbar
3. Prospects without an email are shown as skipped
4. Use `{{contact_name}}` in the body — it is replaced with each prospect's name
5. Click **Send X emails**

All sent emails are logged in Communications automatically. `New` prospects move to `Contacted` after sending.

> SMTP must be configured and tested before sending. See Email Configuration above.

---

### Tracking replies

Replies go to your own email inbox. To log a reply in the app:

1. Go to **Dashboard → Communications**
2. Click the **Prospects** tab to filter prospect messages
3. Find the outbound email card for the prospect
4. Click **Log Reply**
5. Paste the reply content from your inbox
6. Click **Log reply**

The reply is saved as an inbound message and the prospect automatically moves to `Responded`.

---

### Viewing a prospect's communications thread

From the Outreach table, click the **inbox icon** (📥) next to the stage badge on any `Contacted`, `Responded`, `Qualified`, or `Partner` prospect. This opens the Communications page filtered to that prospect's full thread, with a back button to return to Outreach.

---

### Converting a prospect to a customer

When a prospect is ready to become a CRM customer:

1. Click the **UserPlus icon** next to the stage badge in the table, or open the row dropdown → **Convert to Customer**, or open **View** → **Convert to Customer**
2. Review the preview showing what will be created
3. Click **Convert to Customer**

This will:
- Create a new **Customer** record in the CRM with the prospect's name, company, email, phone, and location
- Link all prior communications to the new customer
- Move the prospect stage to **Partner**
- Redirect to the new customer profile

> Convert is available for all prospect stages.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid API key` | Wrong or Test key for Companies House | Create a Live REST key |
| `Geocode error: 401` | Invalid Geoapify key | Check key in `.env.local` and restart dev server |
| `Overpass API error: 504` | Server overloaded | Try again — fallback servers will be attempted |
| `City not found` | City name not recognized by Geoapify | Try a more common city name spelling |
| `API key not configured` | Missing env var | Add the key to `.env.local` and restart dev server |
| `SMTP not configured` | No email settings saved | Go to Settings → Email configuration |
| `Connection timed out` | Wrong host or port | Gmail uses `smtp.gmail.com` port `587` |
| `Authentication failed` | Wrong password | For Gmail use App Password, not your account password |
| `Send button disabled` | Test connection not passed | Run Test connection first, then Save |