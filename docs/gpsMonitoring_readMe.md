# GPS Monitoring — Feature Documentation

> **Project:** Landscaping Operations Platform  
> **Stack:** Next.js · Supabase · Tailwind CSS · shadcn/ui · Bun  
> **Feature status:** Shipped ✅

---

## Overview

The GPS Monitoring feature adds location-aware clock-in/clock-out tracking for field crew. When a crew member clocks into a project, their browser captures their GPS coordinates. Those coordinates are verified server-side against the project's saved site location using the Haversine formula. The result — on-site, off-site, or unverifiable — is shown inline before the entry is saved, and supervisors can see GPS badges on every time entry and issue overrides where needed.

No third-party mapping APIs or API keys are required. Everything runs on the free browser Geolocation API and Nominatim (OpenStreetMap) for geocoding.

---

## How It Works — End to End

```
Crew clicks "Clock in"
       ↓
ClockInDialog opens → selects project
       ↓
"Capture my location" → browser Geolocation API
       ↓
coords POST → /api/gps/verify
       ↓
Server: Haversine distance vs project site_lat/site_lng
  ├─ No site coords saved?
  │     → Nominatim geocodes customer address → caches on project row
  └─ Has coords → calculates distance
       ↓
Result returned: { verified, distance, radius, reason }
       ↓
ClockInDialog shows green / red / amber status card
       ↓
Submit → clockIn() server action saves entry with all GPS data
       ↓
Crew workspace shows GPS badge on active/historical entries
  └─ Off-site? Supervisor sees "Override" button
```

---

## Database Changes

### `time_entries` — new columns

| Column | Type | Description |
|---|---|---|
| `lat` | `float8` | Crew member latitude at clock-in |
| `lng` | `float8` | Crew member longitude at clock-in |
| `accuracy_meters` | `float8` | Browser-reported GPS accuracy |
| `distance_meters` | `float8` | Calculated distance from site centre |
| `gps_verified` | `bool` | Whether distance was within radius |
| `supervisor_override` | `bool` | Whether a supervisor approved off-site entry |
| `override_by` | `uuid` | Profile ID of the supervisor who overrode |
| `override_reason` | `text` | Free-text reason recorded at override |

### `projects` — new columns

| Column | Type | Description |
|---|---|---|
| `site_lat` | `float8` | Site centre latitude |
| `site_lng` | `float8` | Site centre longitude |
| `gps_radius_meters` | `int4` | On-site radius threshold (default 200m) |

---

## Files Added / Modified

### New files

| File | Purpose |
|---|---|
| `lib/utils/geo.ts` | Haversine distance calculation utility |
| `app/api/gps/verify/route.ts` | Server-side GPS verification endpoint |
| `components/dashboard/crew/clock-in-dialog.tsx` | Clock-in flow with GPS capture UI |
| `components/dashboard/crew/supervisor-override-dialog.tsx` | Override dialog for supervisors |

### Modified files

| File | What changed |
|---|---|
| `types/labor-types.ts` | Added GPS + override fields to `TimeEntry`; added `GpsStatus` type and `getGpsStatus()` helper |
| `types/project-types.ts` | Added `siteLat`, `siteLng`, `gpsRadiusMeters` to `Project` and `CreateProjectData` |
| `lib/actions/labor.ts` | `clockIn()` accepts GPS data; added `supervisorOverride()` server action |
| `lib/actions/projects.ts` | `createProject()` / `updateProject()` persist site coords; added `updateProjectSiteCoords()` |
| `lib/hooks/use-labor.ts` | Added `useClockIn`, `useSupervisorOverride` TanStack Query hooks; imported `supervisorOverrideAction` |
| `components/dashboard/crew/crew-workspace.tsx` | GPS badge column on time entries; Override button for supervisors |
| `components/dashboard/projects/project-form-dialog.tsx` | Site Location section with lat/lng inputs, radius input, and "Use my location" button |
| `app/dashboard/projects/[id]/page.tsx` | Added Location tab showing saved coords, radius, and Google Maps link |
| `components/billing/accept-quote-dialog.tsx` | Added `siteLat: null`, `siteLng: null`, `gpsRadiusMeters: 200` to `createProject` call |

---

## Feature Breakdown

### 1. Clock-in GPS capture (`ClockInDialog`)

- Crew selects a project, then clicks **"Capture my location"**
- Browser Geolocation API fires; accuracy shown in the status card
- Coords POST to `/api/gps/verify` with the selected `projectId`
- Three possible outcomes displayed inline:
  - ✅ **On site** — within radius, green card
  - ❌ **Off site** — outside radius, red card showing distance and limit
  - 🟡 **No site coords** — entry recorded but not verified, amber card

### 2. Server-side verification (`/api/gps/verify`)

- Looks up the project's `site_lat` / `site_lng`
- If not set, calls **Nominatim** (OpenStreetMap, free, no API key) to geocode the customer's address, then caches the result on the project row for all future lookups
- Runs **Haversine formula** to calculate great-circle distance in metres
- Returns `{ verified: bool, distance: number, radius: number, reason? }`

### 3. Site location management

Supervisors and admins can set site coordinates three ways:

1. **Manually** — enter lat/lng in the project form dialog
2. **"Use my location"** — button in the project form captures the browser's current position and populates the fields (useful when the manager is physically at the site)
3. **Auto-geocode** — happens automatically on first clock-in if no coords are saved

### 4. GPS badges in Crew Workspace

Every time entry row shows a badge:

| Badge | Meaning |
|---|---|
| 🟢 On site | `gps_verified = true` |
| 🔴 Off site | GPS captured but outside radius; flagged for review |
| 🟡 Overridden | Supervisor approved the off-site entry |
| ⚪ No GPS | Clock-in had no location captured |

### 5. Supervisor override

- Off-site entries show an **Override** button in the crew workspace
- `SupervisorOverrideDialog` prompts for a mandatory reason
- Calls `supervisorOverride()` server action which writes `supervisor_override = true`, `override_by`, and `override_reason` to the time entry
- Badge updates immediately via TanStack Query cache invalidation

### 6. Project location tab

A dedicated **Location** tab on the project detail page (`/dashboard/projects/[id]`) shows:
- Saved coordinates in a monospace block
- On-site radius
- Direct link to Google Maps
- "Edit location" shortcut into the project form dialog
- Clear "not set" state explaining auto-geocoding fallback

---

## Configuration

| Setting | Where | Default |
|---|---|---|
| On-site radius | Project form → Site Location section | 200m |
| GPS accuracy threshold | Browser-controlled | Device-dependent |
| Geocoding provider | `app/api/gps/verify/route.ts` | Nominatim (OSM) |
| Nominatim rate limit | 1 req/sec (OSM policy) | Cached after first use |

---

## Future Aspects

### Short-term

- **Map visualisation on the Location tab** — embed a lightweight map (e.g. Leaflet + OSM tiles, free) showing the site pin and the radius circle so supervisors can visually confirm the geofence before crew clock-in.
- **Clock-out location capture** — currently only clock-in is GPS-verified. Capturing clock-out coords would allow detection of early departures.
- **Bulk override** — allow supervisors to approve multiple off-site entries at once from a queue view instead of one at a time.

### Medium-term

- **Real-time crew map** — a live view showing all currently clocked-in crew on a map, with colour coding by on-site / off-site status. Useful for managers overseeing multiple simultaneous job sites.
- **Geofence alerts** — push notification or in-app alert when a crew member clocks in outside the radius, so supervisors don't have to actively check the crew workspace.
- **Per-crew GPS history** — a route replay or heat-map view per employee per day for compliance or dispute resolution.
- **Mobile PWA enhancements** — background geolocation for continuous on-site presence tracking rather than just a point-in-time clock-in check.

### Long-term

- **Multi-zone projects** — large properties (e.g. golf courses, campuses) may need multiple geofence zones within a single project rather than one circular radius from a centre point.
- **GPS-based auto clock-out** — detect when a crew member leaves the geofence and automatically clock them out (requires persistent background location permission).
- **Integration with payroll** — surface GPS-verified hours vs unverified hours in the billing/payroll export so discrepancies are immediately visible.
- **Audit log for overrides** — a dedicated audit trail view filtering all supervisor overrides across projects, with export to CSV for compliance reviews.
- **Accuracy-aware verification** — if `accuracy_meters` is very high (e.g. > 100m, meaning the GPS fix is poor), automatically downgrade the verification result rather than treating a coarse fix as authoritative.

---

## Zero External Cost

| Dependency | Cost | Notes |
|---|---|---|
| Browser Geolocation API | Free | Built into all modern browsers and mobile WebViews |
| Nominatim (OpenStreetMap) | Free | 1 req/sec rate limit; coords cached after first geocode so per-project it's a one-time call |
| Haversine calculation | Free | Pure TypeScript, runs server-side in the Next.js route handler |

No Google Maps API key, no paid geocoding service, no mapping SDK subscription required.