# Lead Generation — API Setup Guide

This project supports 3 lead generation sources. Follow the steps below to set up each one.

---

## 1. Companies House API (UK Registered Companies)

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

## 2. Geoapify Places API (Local Business Search)

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

## 3. Overpass API (OpenStreetMap)

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

## Final `.env.local` setup

```env
# Companies House (UK registered companies)
COMPANIES_HOUSE_API_KEY=your-key-here

# Geoapify (local business search)
GEOAPIFY_API_KEY=your-key-here

# Overpass (OpenStreetMap) — no key needed
```

---

## How it works in the app

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

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid API key` | Wrong or Test key for Companies House | Create a Live REST key |
| `Geocode error: 401` | Invalid Geoapify key | Check key in `.env.local` and restart dev server |
| `Overpass API error: 504` | Server overloaded | Try again — fallback servers will be attempted |
| `City not found` | City name not recognized by Geoapify | Try a more common city name spelling |
| `API key not configured` | Missing env var | Add the key to `.env.local` and restart dev server |