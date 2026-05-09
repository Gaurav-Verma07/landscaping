# MODULE L — Landscape Design Tool
## Unified Developer Reference · Landscaping Platform · Phase 1

---

## 1. Product Vision

The Landscape Design Tool is the creative core of Landscaping — the feature that separates it from a generic operations platform. Its purpose is to give an owner or designer a fast, professional way to produce a **visual site plan** for a customer that directly feeds the quoting, materials, and project timeline pipeline.

**North star:** In under 15 minutes, a designer uploads a property photo, draws zone overlays, drops plants, and hands the customer a shareable visual plus an auto-drafted quote — all from the browser, zero installs.

---

## 2. What Has Been Built (Phase 1)

### 2.1 Canvas Editor — `design-canvas-editor.tsx`

The main editor component. It is a full-page, three-panel layout: a collapsible left panel (Layers / Plants / Images tabs), the Fabric.js canvas in the center, and a collapsible right panel for zone/shape properties.

**Drawing tools available:**

| Tool | Keyboard | Behaviour |
|---|---|---|
| Select | `V` | Default. Move, resize, or select any canvas object. |
| Draw Zone (Polygon) | `P` | Click to add vertices. Double-click to close and commit zone to DB. |
| Rectangle | `R` | Click & drag. Released shape is auto-committed as a zone. |
| Square | `Q` | Same as Rectangle but constrained to equal sides. |
| Circle / Ellipse | `C` | Click & drag. Approximated as a 32-point polygon for area calc. |
| Text Label | `T` | Click to place an editable `IText` label. |
| Measure / Calibrate | `M` | Click two points on canvas → enter real-world distance → sets `pixelsPerFoot`. |
| Pan | `Space` | Temporary pan mode while held. |

**Additional keyboard shortcuts:**

| Key | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+S` | Manual save |
| `Del` / `Backspace` | Delete selected object (removes from DB if zone/plant) |
| `G` | Toggle grid overlay |
| `Escape` | Cancel polygon drawing or return to Select mode |

**Undo / Redo:**
An in-memory stack (`undoStack` / `redoStack` refs, capped at 60 snapshots via `CANVAS_DEFAULTS.UNDO_STACK_LIMIT`) stores serialised Fabric JSON. Undo/redo restores the canvas visual state only — it does **not** roll back DB mutations. This is a known Phase 1 limitation (see §9).

**Save behaviour:**
Save is **manual only** — no auto-save. The `isDirty` flag is set on any object modification or addition (after init). The toolbar shows a "Save" button with a loading spinner; `Ctrl+S` also triggers it. On unload, the browser fires the standard "unsaved changes" native dialog. On in-app navigation (`router.push`), an `AlertDialog` intercepts with Save / Leave without saving / Stay options.

**Save payload:**
On save, `canvas.toObject(['data'])` is serialised to JSON and stored in `landscape_designs.canvas_state.fabricJson`. A 0.3× scaled PNG thumbnail is also saved to `thumbnailUrl` in the DB record.

**Layer system:**
Five layer toggles in the Layers panel control object visibility on the canvas and persist to `canvas_state.layers`:

- `background` — the property photo
- `zones` — all zone polygons/shapes
- `plants` — all plant group objects
- `labels` — IText labels
- `measurements` — measurement lines (tracked in state, not yet drawn as canvas objects in Phase 1)

Toggling a layer in the panel immediately updates canvas object visibility and patches the DB record.

**Fullscreen mode:**
A toggle button in the toolbar switches the editor between its normal layout context and a CSS `fixed inset-0 z-50` full-screen mode, useful on smaller screens.

### 2.2 Zone System

Zones are the primary units of the design. Every polygon, rectangle, square, or ellipse drawn on the canvas becomes a zone record in the `design_zones` table.

**Zone creation flow:**

1. User draws a shape using any drawing tool.
2. On commit (double-click for polygon; mouse-up for shapes), the editor calls `upsertZone.mutateAsync()` with computed area and polygon points.
3. The returned zone ID is stored in the Fabric object's `.data.zoneId` property.
4. The canvas object's fill and stroke are set from `ZONE_TYPE_COLORS[defaultZoneType]` at 35% opacity.
5. `totalAreaSqft` on the design record is updated.

**Zone types** (from `ZONE_TYPES` enum):
`lawn`, `planting_bed`, `hardscape`, `water`, `edging`, `mulch`, `gravel`, `other`

Each has a distinct colour defined in `ZONE_TYPE_COLORS`.

**Zone properties panel (`zone-properties-panel.tsx`):**
Appears in the right panel when a zone is selected. Editable fields: name, zone type, fill material (free text, matched to material catalog on export), colour override (hex picker), notes. Changes call `upsertZone` immediately.

**Area calculation:**
`polygonAreaPx(points)` uses the shoelace formula on the raw pixel coordinates. `pxAreaToSqFt(areaPx, pixelsPerFoot)` divides by `pixelsPerFoot²` to get real-world square footage — only meaningful after scale calibration.

### 2.3 Scale Calibration

The `measure` tool (`M`) activates a two-click flow:

1. Click point A on the canvas → a blue dot appears.
2. Click point B → `ScaleCalibrationDialog` opens.
3. User enters the real-world distance in feet between the two points.
4. `pixelsPerFoot` is computed as `pixelDistance / distanceFt` and stored in `canvas_state.pixelsPerFoot`.

Without calibration, the default is `CANVAS_DEFAULTS.DEFAULT_SCALE_PPF = 10` (1 ft = 10 px). Zone areas are computed from this, so uncalibrated designs show approximate/meaningless sq ft values.

**Known issue:** The calibration first-point state is managed via both React state and a ref (`calibrationFirstPointRef`) to avoid stale closures in the mouse event effect. Both must stay in sync; if they drift, the second click may not trigger the dialog.

### 2.4 Plant Library

**Panel (`plant-library-panel.tsx`):**
A searchable, filterable sidebar tab showing entries from the `plant_catalog` table. Filters: search text, plant type, sun requirement, water need. Each card shows a colour-coded icon (based on `PLANT_TYPE_ICON_COLORS`), common name, botanical name, and mature spread.

**Placing plants:**
Plants can be placed two ways:
- **Drag to canvas:** The card sets `dataTransfer` with `plant-json`. The canvas container's `onDrop` handler reads this, computes canvas coordinates from `e.clientX - rect.left`, and calls `handlePlantDrop`.
- **Click "Add" button:** Calls `handlePlantDrop` without coordinates; plant is centred on the canvas.

**Canvas representation:**
Each plant is a Fabric `Group` containing a `Circle` (radius = `matureSpreadFt × pixelsPerFoot / 2`, min 8 px) and a `Text` label. The group's `.data.plantId` links it to the DB record.

**Plant catalog seed data:**
The file `plant-catalog-seed.ts` contains the starter set of species for seeding the `plant_catalog` table. Coverage is North American common landscaping species.

### 2.5 Image Library

A third left-panel tab ("Images") lets users upload arbitrary images (JPEGs, PNGs, WebPs, GIFs) to Supabase Storage under `design-images/designs/{designId}/`. Uploaded images appear as thumbnails in the panel; clicking one adds it to the canvas as a moveable, resizable `FabricImage` object.

The background photo (set via the toolbar's photo upload button) is a special case: it is always sent to the back and its URL is stored in `canvas_state.backgroundImageUrl` so it can be restored on reload.

**Bucket management:**
On editor load, the code calls `supabase.storage.createBucket('design-images', { public: true })` — this is safe to call repeatedly (409 errors are suppressed). Existing images for the design are then listed and their public URLs are loaded into `state.imageLibrary`.

### 2.6 Export

**PNG export:** `canvas.toDataURL({ format: 'png', multiplier: 2 })` — 2× scale for presentation quality. Triggered from `ExportDialog`.

**PDF export:** Uses `jsPDF` (landscape A4). Layout:
- Page 1: Design name, customer name, total area, generation date, then the canvas image embedded at 180×110mm.
- Page 2 (optional, if `includeLegend`): Zone legend table with colour swatches, zone names, types, and areas.
- Materials list page is planned but not yet rendered (dialog has the toggle; the rendering path is a no-op in Phase 1).

### 2.7 Materials List Dialog — `materials-list-dialog.tsx`

Invoked from the toolbar ("Materials" button). Calls `computeMaterialsList(designId)` server action, which derives quantities from zone areas and plant placements. The result is a `DesignMaterialsList` with line items (description, qty, unit, estimated unit price, estimated total).

The dialog also has a **"Send to Quote"** button that will pass the materials list to Module G's quote form (integration point — partially scaffolded in Phase 1).

### 2.8 Design List Page — `design-list-workspace.tsx`

The index page at `/dashboard/design`. Shows all designs for the org as cards with thumbnail, name, customer, status badge, total area, zone/plant counts, and last-updated timestamp. Includes a "New Design" button that opens `new-design-dialog.tsx` to pick a customer, optionally link a project, and name the design.

### 2.9 AI Integration — `tool-executor-design-additions.ts`

The file documents the additions needed to the main `tool-executor.ts` switch to enable the AI assistant to interact with designs. It is currently in **commented-out form** — a reference patch, not yet wired in.

Once integrated, supported AI tools will be:

| Tool | Type | Description |
|---|---|---|
| `get_designs` | Read | List designs, filterable by customer or project |
| `get_design` | Read | Fetch a single design with zones and plant count |
| `suggest_plants` | Read | Filter catalog by zone description, sun, water, plant type |
| `get_design_materials_list` | Read | Run `computeMaterialsList` and return line items |
| `create_design` | Write (requires approval) | Create a blank design record |
| `design_to_quote` | Write (requires approval) | Convert design materials list into a draft quote |

`suggest_plants` already parses natural language hints in `zone_description` — e.g., "full sun, low water" → filters catalog accordingly without requiring explicit enum values.

---

## 3. Data Model

### `landscape_designs`

```sql
id                uuid PK
org_id            uuid FK → orgs
customer_id       uuid FK → customers
project_id        uuid FK → projects (nullable)
name              text
status            enum: draft | shared | approved | archived
canvas_state      jsonb   -- CanvasState object (see below)
thumbnail_url     text    -- 0.3× PNG data URL saved on each manual save
total_area_sqft   float   -- sum of all zone areas
notes             text
created_by        uuid FK → users
created_at        timestamptz
updated_at        timestamptz
```

**`canvas_state` JSONB structure:**

```ts
{
  backgroundImageUrl: string | null,   // data URL or Storage public URL
  fabricJson: string | null,           // full Fabric.js canvas.toObject() JSON
  labels: CanvasLabel[],               // currently unused in rendering (Phase 1)
  measurements: CanvasMeasurement[],  // currently unused in rendering (Phase 1)
  pixelsPerFoot: number,               // default 10
  panX: number,                        // reserved, not yet applied on load
  panY: number,                        // reserved
  zoom: number,                        // reserved
  layers: {
    background: boolean,
    zones: boolean,
    plants: boolean,
    labels: boolean,
    measurements: boolean,
  }
}
```

### `design_zones`

```sql
id              uuid PK
design_id       uuid FK → landscape_designs
name            text
zone_type       enum: lawn | planting_bed | hardscape | water | edging | mulch | gravel | other
fill_material   text       -- free text, matched to supplier catalog on export
area_sqft       float      -- computed from polygon + scale
polygon_points  jsonb      -- ZonePoint[]: [{x, y}, ...]
color_override  text       -- hex string; null = use ZONE_TYPE_COLORS default
notes           text
created_at      timestamptz
updated_at      timestamptz
```

### `design_plants`

```sql
id                uuid PK
design_id         uuid FK → landscape_designs
zone_id           uuid FK → design_zones (nullable — plants can be unzoned)
plant_catalog_id  uuid FK → plant_catalog
x                 float      -- canvas X coordinate in pixels
y                 float      -- canvas Y coordinate in pixels
quantity          int        -- typically 1; can represent a group
spacing_ft        float      -- from catalog matureSpreadFt at placement
rotation          float      -- degrees (stored but not yet applied visually)
scale_multiplier  float      -- reserved for future resize UX
common_name       text       -- denormalised for fast display
plant_type        text       -- denormalised
created_at        timestamptz
```

### `plant_catalog`

```sql
id                uuid PK
org_id            uuid FK (null = global / seeded)
common_name       text
botanical_name    text
plant_type        enum: tree | shrub | perennial | annual | groundcover | grass | vine | succulent | fern | bulb
sun_requirement   enum: full_sun | part_shade | full_shade
water_need        enum: low | medium | high
mature_height_ft  float
mature_spread_ft  float
hardiness_zones   text[]
icon_url          text       -- top-down SVG icon (null if not yet uploaded)
thumbnail_url     text       -- photo (null if not yet uploaded)
notes             text
created_at        timestamptz
updated_at        timestamptz
```

---

## 4. File Map

```
src/
├── app/dashboard/design/
│   ├── page.tsx                        -- List page
│   ├── design-page.tsx                 -- List workspace wrapper
│   ├── [id]/
│   │   └── page.tsx                    -- Editor page (passes designId to DesignCanvasEditor)
│   └── editor/
│       └── design-editor-page.tsx      -- Editor layout shell

src/components/design/
├── design-canvas-editor.tsx            -- Main editor (1350 lines, core logic)
├── design-toolbar.tsx                  -- Top toolbar (tool toggles, save, export, back nav)
├── design-list-workspace.tsx           -- Grid of design cards
├── layers-panel.tsx                    -- Layer visibility toggles
├── plant-library-panel.tsx             -- Searchable plant catalog sidebar
├── zone-properties-panel.tsx           -- Right panel: selected zone details
├── scale-calibration-dialog.tsx        -- Two-point scale calibration dialog
├── export-dialog.tsx                   -- PNG / PDF export options
├── materials-list-dialog.tsx           -- Computed materials + Send to Quote
├── new-design-dialog.tsx               -- Create design wizard
└── plant-catalog-seed.ts               -- ~200 seed species for plant_catalog

src/types/
├── design-types.ts                     -- All TypeScript interfaces
└── design-enums.ts                     -- All constants (tool modes, zone types, colors, defaults)

src/lib/hooks/
└── use-design.ts                       -- TanStack Query hooks for all design mutations

src/lib/actions/
└── design-actions.ts                   -- Server actions: getDesign, upsertZone, upsertPlant,
                                           computeMaterialsList, designToQuoteDraft, etc.

src/lib/ai/
└── tool-executor-design-additions.ts   -- Reference patch for AI tool executor (commented out)
└── tools-index-updated.ts              -- Updated tools index including design tools

utils/
└── canvas-utils.ts                     -- polygonAreaPx, pxAreaToSqFt, generateZoneName,
                                           formatArea, hexToRgba

db/
└── design-migration.sql                -- Supabase migration for all four design tables
```

---

## 5. External Dependencies

| Package | Purpose | How used |
|---|---|---|
| `fabric` (v6/v7) | Canvas engine | Dynamic import (`await import('fabric')`) to avoid Next.js SSR crash |
| `jspdf` | PDF generation | Client-side, no server round-trip; embedded in export flow |
| `@supabase/supabase-js` | Storage + DB | `design-images` bucket for photos; `landscape_designs` / `design_zones` / `design_plants` / `plant_catalog` tables |
| `@tanstack/react-query` | Data fetching and mutations | All design hooks follow the platform-wide TanStack Query pattern |
| `lucide-react` | Icons | Toolbar and panel icons |
| `sonner` | Toast notifications | Save success, upload errors, calibration confirmation |
| `next/navigation` | Routing | `useRouter` for back-navigation guard |

**Install (if starting fresh):**
```bash
bun add fabric jspdf
bun add -D @types/fabric
```

`html-to-image` was considered but not used — PNG export is done entirely via `canvas.toDataURL()`.

---

## 6. TanStack Query Hooks — `use-design.ts`

All mutations follow the standard platform pattern.

| Hook | Operation |
|---|---|
| `useDesigns()` | List all designs for org |
| `useDesign(id)` | Fetch single design with zones + plants |
| `useCreateDesign()` | Create new design record |
| `useUpdateDesign()` | Patch design fields (canvasState, name, status, etc.) |
| `useDeleteDesign()` | Delete design |
| `useUpsertZone()` | Create or update a zone (used on every shape commit) |
| `useDeleteZone()` | Delete zone and remove from design |
| `useUpsertPlant()` | Create or update a plant placement |
| `useDeletePlant()` | Delete plant placement |
| `usePlantCatalog()` | Fetch all plant catalog entries (filterable client-side) |
| `useCreatePlantCatalogItem()` | Add custom plant (org-scoped) |

---

## 7. Core User Flows

### Flow A — New Design

1. `/dashboard/design` → "New Design" → pick customer, optional project, name → submit.
2. Redirect to `/dashboard/design/{id}`.
3. Upload property photo via toolbar button (stored as data URL in `canvas_state.backgroundImageUrl`, sent to back of canvas).
4. Activate `measure` tool → click two known points → enter real distance → scale set.
5. Activate `polygon` / `rectangle` / `circle` → draw zones → each committed to DB on finish.
6. Switch to Plants tab → search / filter → drag plant to canvas → committed to DB.
7. Open "Materials" dialog → review computed list → optionally push to Quote.
8. `Ctrl+S` or Save button → canvas JSON + thumbnail persisted.
9. Export → PNG for client presentation or PDF proposal.

### Flow B — From Existing Project

From any project record, "Create Design" links the new design to the project ID. The editor is identical; zones' area measurements auto-propagate to the project's property detail fields (via `designToQuoteDraft` integration, Phase 2 completion needed).

### Flow C — AI-Assisted Plant Selection

(Once AI tools are wired in.) User types in the AI panel: "Suggest plants for a shaded low-water front bed." The assistant calls `suggest_plants` with the zone description, gets up to 8 catalog matches, and lists them with catalog IDs. The user can then open the editor's plant library and filter by those results.

---

## 8. Known Issues & Phase 1 Limitations

### 8.1 Undo Does Not Reverse DB Mutations

Undo restores the canvas visual state from a JSON snapshot, but it does not call the corresponding delete/revert mutations. If a user draws a zone, then undoes it, the zone polygon disappears from the canvas but the `design_zones` record remains in the DB. On next reload, the zone will reappear.

**Workaround:** Delete zones explicitly using the Delete key or the "Delete Shape" button in the properties panel, which does fire the DB mutation.

### 8.2 Background Image as Data URL

When a local file is uploaded as background, it is stored as a `data:image/...` base64 string inside `canvas_state.backgroundImageUrl`. This inflates the JSONB column significantly (a 2MB photo = ~2.7MB base64 string). For Supabase's `jsonb` column this is technically fine, but it will slow down save/load for large photos.

**Planned fix:** Upload background to the `design-images` bucket on selection, store the public URL instead. Partially scaffolded in the image library flow but not yet applied to the background-specific path.

### 8.3 Scale Calibration Stale Closure Risk

The measure tool's mouse handler reads `calibrationFirstPoint` from React state via a `useEffect` that depends on `state.activeTool` and `state.polygonPoints`. To avoid the stale closure problem, a ref mirror (`calibrationFirstPointRef`) was added. Both must stay in sync. If you add code that updates state related to calibration without updating the ref, the second click will not trigger the dialog.

### 8.4 Plant Rotation and Scale Not Applied Visually

`DesignPlant.rotation` and `scaleMultiplier` are stored in the DB but the canvas rendering (`drawPlantOnCanvas`) does not yet apply them. All plants appear at a fixed computed radius regardless of scale multiplier, and unrotated.

### 8.5 Fabric.js v7 API Surface

The project uses Fabric v7, which has breaking changes from v5/v6 (most notably the canvas event system and how `fromURL` works). The code uses `opt.scenePoint` for mouse coordinates (v7 API). If downgraded to v5/v6, all mouse handlers need to switch to `opt.pointer`. Conversely, if upgrading past v7, check `Image.fromURL` signature and `loadFromJSON` behaviour.

### 8.6 `toObject` Custom Data

Fabric's `canvas.toObject(['data'])` serialises the custom `.data` property on each object (used to store `zoneId`, `plantId`, `isBackground`, etc.). This is critical for re-associating canvas objects with DB records after undo/redo. If `.data` is ever missing (e.g., shape added without setting `.data`), undo/redo restores visuals but breaks the zone/plant selection link in the properties panel.

### 8.7 Image CORS on Reload

When a background image is stored as a Supabase Storage public URL, reloading it via `fabric.Image.fromURL(url, { crossOrigin: 'anonymous' })` requires the Storage bucket's CORS policy to allow the app's origin. If the bucket CORS is not configured, images load on first upload (from the local file, no CORS needed) but fail silently on reload (from URL). Check Supabase Storage CORS settings if backgrounds disappear after a save/reload cycle.

### 8.8 Polygon Point Recording During Fast Clicks

The polygon tool records clicks in React state (`polygonPoints`) inside a `useEffect` that has `state.polygonPoints` as a dependency. If the user clicks faster than React's state batching processes updates, points can be dropped. This is rare in practice but can occur on older hardware. A ref-based accumulator (like the calibration fix) would be more robust.

### 8.9 AI Tool Integration Not Yet Wired

`tool-executor-design-additions.ts` is a commented-out reference patch. The design AI tools (`get_designs`, `suggest_plants`, `design_to_quote`, etc.) are not active in the AI assistant yet. The file documents exactly where and how to add them.

### 8.10 Materials PDF Page Not Rendered

The Export dialog has an `includeMaterials` toggle, and the `exportPdf` function accepts it as a parameter, but the materials page rendering block inside `exportPdf` is not yet implemented — the toggle has no effect currently.

### 8.11 `panX` / `panY` / `zoom` Not Restored on Load

`canvas_state` stores `panX`, `panY`, and `zoom`, but the canvas init code does not apply these on load. The canvas always opens at default zoom/position. These are reserved for Phase 2.

### 8.12 Mobile / Touch Not Supported

Fabric.js has limited touch support and the editor layout (three-panel, fixed toolbars) is not responsive. The tool is desktop-only in Phase 1.

---

## 9. Phase 2 Roadmap

### Near-Term

- **DB-aware undo/redo** — wrap each action in a reversible command object so undo fires the correct delete/revert mutation.
- **Background image upload to Storage** — replace data URL storage with a proper bucket upload on file selection.
- **Pan and zoom persistence** — apply saved `panX` / `panY` / `zoom` on canvas init.
- **Plant scale and rotation UI** — honour `scaleMultiplier` and `rotation` in `drawPlantOnCanvas`.
- **Wire AI design tools** — apply the patch from `tool-executor-design-additions.ts`.
- **Materials PDF export** — complete the `exportPdf` materials page rendering.
- **Send to Quote** — complete the `designToQuoteDraft` server action integration so the materials list pre-fills Module G.

### Medium-Term

- **Design templates** — pre-built layouts (front yard, pool surround, etc.) loaded as a starting canvas state.
- **Multi-version designs** — "Option A / Option B" branching.
- **Google Maps satellite import** — auto-fetch aerial photo from the customer's address.
- **Before/after toggle** — overlay opacity slider comparing original photo vs. annotated design.
- **Trefle API integration** — live plant search beyond the internal catalog.
- **Client portal share link** — UUID-based read-only view without login.

### Long-Term

- **3D preview** — lightweight Three.js scene extruding zones with plant height proxies.
- **Photorealistic rendering** — AI inpainting to composite plant images onto the property photo.
- **AR companion** — mobile camera overlay.
- **Design → timeline auto-scheduling** — AI reads materials list and creates project phase milestones in Module E automatically.
- **Regional plant filtering** — detect customer hardiness zone from address, auto-filter catalog.

---

## 10. Integration Points with Existing Modules

| Module | Integration | Status |
|---|---|---|
| **Module A (CRM)** | Design linked to customer; thumbnail shows in customer timeline | DB FK in place; timeline display TBD |
| **Module E (Projects)** | Design linked to project; area measurements feed project property fields | FK in place; area sync TBD |
| **Module G (Billing)** | Materials list → quote line items; design PDF attaches to quote | `designToQuoteDraft` scaffolded; UI wiring Phase 2 |
| **Module H (AI)** | AI tools for plant suggestion, materials calc, quote drafting | Reference patch written; not yet active |
| **Module K (Documents)** | Exported PDFs auto-saved to project document vault | Not yet implemented |
| **Module M (Search)** | Designs indexed by customer name, plant names, project | Not yet implemented |

---

## 11. API Routes

```
POST   /api/designs                   Create new design record
GET    /api/designs/[id]              Load design (canvas_state + zones + plants)
PATCH  /api/designs/[id]              Save canvas state (manual trigger only)
DELETE /api/designs/[id]              Delete design

GET    /api/designs/[id]/export       Returns PNG buffer (server thumbnail)
POST   /api/designs/[id]/to-quote     Convert design → draft quote payload

GET    /api/plant-catalog             List plants (filterable by type, sun, water)
POST   /api/plant-catalog             Add custom plant (org-scoped)

POST   /api/ai/design/suggest-plants       Zone description → plant suggestions
POST   /api/ai/design/materials-list       Zones + areas → computed materials qty
```

---

## 12. Supabase Setup Checklist

- [ ] Run `design-migration.sql` to create the four tables.
- [ ] Seed `plant_catalog` using `plant-catalog-seed.ts`.
- [ ] Create `design-images` Storage bucket with `public: true` (the editor also creates it on first load, but pre-creating avoids permission edge cases).
- [ ] Set Storage CORS policy to allow your app origin for `design-images`.
- [ ] Add RLS policies on all four tables (org-scoped access pattern matching the rest of the platform).

---

*Version 1.0 — Landscaping Platform · April 2026*  
