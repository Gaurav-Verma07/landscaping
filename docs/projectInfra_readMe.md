# Infrastructure & Architecture

Technical reference for the Landscaping Operations & AI Office Platform. Covers data fetching, state management, routing, auth, API layer, and conventions.

---

## Table of contents

1. [Stack](#stack)
2. [Project structure](#project-structure)
3. [Data fetching architecture](#data-fetching-architecture)
4. [Store hooks](#store-hooks)
5. [Server actions](#server-actions)
6. [Supabase client](#supabase-client)
7. [Authentication](#authentication)
8. [Routing](#routing)
9. [API routes](#api-routes)
10. [Layout & providers](#layout--providers)
11. [Component conventions](#component-conventions)
12. [Adding a new module](#adding-a-new-module)
13. [Known issues & gotchas](#known-issues--gotchas)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Runtime | Bun |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| UI | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Data fetching | TanStack Query v5 |
| Email | Nodemailer (SMTP per user) |
| Voice | ElevenLabs (optional) |
| AI | Anthropic Claude API |

---

## Project structure

```
src/
├── app/                          Next.js App Router
│   ├── actions/                  Server actions scoped to app (profile)
│   ├── api/                      API Route Handlers
│   │   ├── cron/campaigns/       Scheduled campaign processor
│   │   └── elevenlabs/           Voice assistant token endpoints
│   ├── auth/                     Auth pages (login, signup, callback)
│   ├── dashboard/                All dashboard pages
│   │   ├── layout.tsx            Dashboard shell (QueryProvider + Sidebar)
│   │   └── [module]/page.tsx     One page per module
│   └── layout.tsx                Root layout (ThemeProvider, fonts)
│
├── components/
│   ├── auth/                     Login, signup forms
│   ├── dashboard/
│   │   ├── layout/               Sidebar, header, command menu, voice
│   │   ├── [module]/             UI components per module
│   │   └── ui/                   Shared dashboard UI (skeletons, placeholders)
│   ├── query-provider.tsx        TanStack QueryClientProvider wrapper
│   └── ui/                       shadcn/ui base components
│
├── lib/
│   ├── actions/                  Server actions (one file per module)
│   ├── hooks/                    TanStack Query hooks (one file per module)
│   ├── supabase/                 Supabase client, server, middleware
│   ├── stores.tsx                Unified re-export shim for all hooks
│   ├── *-types.ts                TypeScript types per module
│   └── query-client.ts           Singleton QueryClient config
│
├── store/
│   ├── use-user-store.ts         Zustand store for auth user
│   └── use-ui-store.ts           Zustand store for UI state
│
└── types/                        Shared global types
```

---

## Data fetching architecture

The platform uses **TanStack Query** for all server data. Data is fetched lazily — only when a component that uses the relevant hook mounts.

### How it works

```
User visits /dashboard/customers
  → CustomersWorkspace mounts
  → useCustomerStore() calls useCustomers()
  → TanStack Query checks cache
    → Cache hit: returns immediately, no fetch
    → Cache miss: calls getCustomers() server action
  → Data renders
```

### Key config (lib/query-client.ts)

```ts
staleTime: 2 * 60 * 1000   // data considered fresh for 2 minutes
gcTime:    5 * 60 * 1000   // unused data removed from cache after 5 minutes
refetchOnWindowFocus: false  // no background refetch on tab switch
retry: 2                     // retry failed requests twice
```

### Cache invalidation

After any mutation, the relevant query key is invalidated:

```ts
onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all })
```

This triggers a background refetch only for components currently using that data.

### Optimistic updates

Delete and status-change mutations use optimistic updates — the UI updates instantly and rolls back on error:

```ts
onMutate: async (id) => {
  const previous = queryClient.getQueryData(keys.all)
  queryClient.setQueryData(keys.all, (old) => old.filter(x => x.id !== id))
  return { previous }
},
onError: (_e, _id, ctx) => {
  queryClient.setQueryData(keys.all, ctx.previous)
}
```

---

## Store hooks

All data hooks live in `src/lib/hooks/`. Each file exports:

1. **Query hooks** — `useCustomers()`, `useProjects()`, etc.
2. **Mutation hooks** — `useCreateCustomer()`, `useDeleteProject()`, etc.
3. **Backward compat shim** — `useCustomerStore()` that wraps all hooks into the original store API

### Available hooks

| File | Hook | Query key |
|---|---|---|
| `use-customers.ts` | `useCustomerStore()` | `['customers']` |
| `use-projects.ts` | `useProjectStore()` | `['projects']` |
| `use-billing.ts` | `useBillingStore()` | `['quotes']`, `['invoices']`, etc. |
| `use-appointments.ts` | `useAppointmentStore()` | `['appointments']` |
| `use-outreach.ts` | `useOutreachStore()` | `['prospects']` |
| `use-labor.ts` | `useLaborStore()` | `['employees']` |
| `use-documents.ts` | `useDocumentStore()` | `['documents']` |
| `use-equipment.ts` | `useEquipmentStore()` | `['equipment-assets']`, `['equipment-bookings']` |
| `use-communications.ts` | `useCommunicationStore()` | `['communications']`, etc. |
| `use-audit.ts` | `useAuditStore()` | `['audit-log']` |
| `use-marketing.ts` | `useMarketingStore()` | `['campaigns']` |

### Import pattern

All hooks are re-exported from `lib/stores.tsx`:

```ts
// Preferred — import from stores
import { useCustomerStore } from '@/lib/stores'

// Also works — import directly from hook file
import { useCustomers, useCreateCustomer } from '@/lib/hooks/use-customers'
```

### Loading states

```tsx
const { customers, loading } = useCustomerStore()

if (loading) {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
      Loading customers...
    </div>
  )
}
```

---

## Server actions

All database operations are server actions in `src/lib/actions/`. They run on the server — never exposed to the client bundle.

### Pattern

```ts
'use server'

import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getCustomers(): Promise<Customer[]> {
  const { supabase, user } = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('profile_id', user.id)
  return (data ?? []).map(mapCustomer)
}
```

### Return type convention

- **Success:** `{ data: T }`
- **Error:** `{ error: string }`
- **List:** `T[]` (empty array on failure, never throws)

### Files

| File | Covers |
|---|---|
| `customers.ts` | Customer CRUD, notes, timeline, attachments |
| `projects.ts` | Projects, milestones, supervisor reports |
| `billing.ts` | Quotes, contracts, invoices, suppliers, materials, templates |
| `appointments.ts` | Appointments |
| `outreach.ts` | Prospects, bulk ops, stage moves |
| `communications.ts` | Messages, templates, rules, sequences, scheduled |
| `labor.ts` | Employees, time entries, clock in/out |
| `documents.ts` | Documents, file upload |
| `equipment.ts` | Assets, bookings, conflict check |
| `marketing.ts` | Campaigns, send, recipient resolution |
| `audit.ts` | Audit log |
| `social-posts.ts` | Social media content calendar |
| `email.ts` | SMTP send, bulk send, connection test |
| `review-requests.ts` | Post-invoice review request emails |

---

## Supabase client

### Server (actions, layouts, pages)

```ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

The server client reads cookies per-request. Cookie writes are wrapped in try/catch so they work in both Server Actions (where writes are allowed) and Server Components (where they are not).

### Client (browser components)

```ts
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

Used only when you need real-time subscriptions or direct client-side Supabase access. Prefer server actions for all CRUD.

### Service role (cron, admin)

```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

Used in `/api/cron/campaigns/route.ts` to bypass RLS when processing scheduled campaigns.

---

## Authentication

Auth is handled by Supabase Auth with the `@supabase/ssr` package.

### Flow

```
/auth/login → user submits → supabase.auth.signInWithPassword()
  → redirects to /auth/callback
  → callback/route.ts exchanges code for session
  → redirects to /dashboard
```

### Session in layouts

The dashboard layout fetches the user server-side once and passes it down:

```ts
// app/dashboard/layout.tsx
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Session in stores

`StoreInitializer` receives the server-fetched user and hydrates the Zustand user store:

```ts
// store/use-user-store.ts — Zustand
useUserStore.setState({ user, isLoading: false })
```

### Middleware

`src/lib/supabase/middleware.ts` refreshes the session on every request and redirects unauthenticated users from `/dashboard/*` to `/auth/login`.

### Row Level Security

Every table has RLS enabled. All policies use `profile_id = auth.uid()` so each company only sees its own data.

---

## Routing

All dashboard routes live under `app/dashboard/`. The layout at `app/dashboard/layout.tsx` wraps all pages with the sidebar, header, and QueryProvider.

### Route structure

```
/dashboard                    → Overview page
/dashboard/customers          → Customer list
/dashboard/customers/[id]     → Customer profile
/dashboard/customers/[id]/edit → Edit customer
/dashboard/customers/new      → New customer form
/dashboard/projects           → Projects list
/dashboard/projects/[id]      → Project detail
/dashboard/quotes             → Quotes
/dashboard/invoices           → Invoices
/dashboard/invoices/[id]      → Invoice detail / PDF preview
/dashboard/contracts          → Contracts
/dashboard/contracts/[id]     → Contract detail
/dashboard/appointments       → Appointments calendar
/dashboard/crew               → Crew & labor
/dashboard/equipment          → Equipment assets
/dashboard/documents          → Documents vault
/dashboard/communications     → Inbox
/dashboard/communications/settings → Templates, rules, sequences
/dashboard/outreach           → Prospect pipeline
/dashboard/marketing          → Campaigns, analytics, social, calendar
/dashboard/management/settings → Company settings, SMTP
/dashboard/management/integrations → Integrations
/dashboard/admin              → Audit log
```

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/cron/campaigns` | POST / GET | Processes scheduled email campaigns. Called by cron-job.org every 15 min. Protected by `x-cron-secret` header |
| `/api/elevenlabs/conversation-token` | POST | Returns an ElevenLabs signed conversation token for the voice assistant |
| `/api/elevenlabs/signed-url` | GET | Returns a signed URL for ElevenLabs |
| `/api/internal/telemetry` | POST | Internal telemetry endpoint |

---

## Layout & providers

### Provider tree (app/dashboard/layout.tsx)

```tsx
<QueryProvider>              ← TanStack Query cache (single instance)
  <SidebarProvider>          ← Sidebar open/close state
    <StoreInitializer />     ← Hydrates Zustand user store
    <AppSidebar />           ← Sidebar nav
    <SidebarInset>
      <VoiceAssistantProvider>
        <DashboardHeader />  ← Header + CommandMenu + theme toggle
        {children}           ← Page content
        <VoiceAssistantDock />
      </VoiceAssistantProvider>
    </SidebarInset>
  </SidebarProvider>
</QueryProvider>
```

**No store providers in layout.** All data fetches lazily via TanStack Query when the relevant page is visited.

### Why QueryProvider is the only provider

Previously each store had its own provider (`CustomerStoreProvider`, `ProjectStoreProvider`, etc.) that fetched data on mount regardless of which page was open. This caused 10+ Supabase requests on every dashboard page load.

TanStack Query eliminates this — the cache is shared across the whole app via a single `QueryProvider`, and data only fetches when a component that needs it actually mounts.

---

## Component conventions

### Workspace components

Each module has a main `*-workspace.tsx` that:
- Calls the store hook to get data
- Handles loading state
- Renders the module UI
- Opens dialogs via local state

```tsx
export function CustomersWorkspace() {
  const { customers, loading } = useCustomerStore()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Loading customers...
      </div>
    )
  }

  return <div>...</div>
}
```

### Dialog components

Dialogs receive `open`, `onOpenChange`, and an optional entity prop:

```tsx
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
}
```

### Server actions in components

Never call server actions directly from a component. Always go through the store hook or a mutation hook:

```tsx
// ❌ Don't
await createCustomer(data)

// ✅ Do
const { createCustomer } = useCustomerStore()
await createCustomer(data)
```

---

## Adding a new module

Follow these steps to add a new module consistently:

**1. Database** — Run SQL in Supabase SQL Editor to create table + RLS policy

**2. Types** — Create `src/lib/[module]-types.ts`

**3. Server actions** — Create `src/lib/actions/[module].ts` with `'use server'`

**4. Hook** — Create `src/lib/hooks/use-[module].ts` with query + mutation hooks + shim

**5. Re-export** — Add to `src/lib/stores.tsx`:
```ts
export { useModuleStore } from '@/lib/hooks/use-module'
export const ModuleStoreProvider = NoOp
```

**6. Components** — Create `src/components/dashboard/[module]/[module]-workspace.tsx`

**7. Page** — Create `src/app/dashboard/[module]/page.tsx`:
```tsx
import { ModuleWorkspace } from '@/components/dashboard/[module]/module-workspace'
export default function ModulePage() {
  return <ModuleWorkspace />
}
```

**8. Sidebar** — Add route to `src/components/dashboard/layout/app-sidebar.tsx`

---

## Known issues & gotchas

**`script tag` warning on ThemeProvider**
A harmless console warning from `next-themes` + Turbopack. Does not affect functionality. Ignored in production builds.

**Supabase `setAll` in Server Components**
`createClient()` wraps `cookieStore.set()` in a try/catch. Cookie writes are silently ignored in Server Components (read-only context) but work correctly in Server Actions and Route Handlers.

**ElevenLabs voice assistant**
Requires `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` env var. If not set, the voice button is hidden. The signed URL endpoint at `/api/elevenlabs/signed-url` must be publicly accessible.

**Cron scheduled campaigns**
Requires deployment to Vercel and registration on cron-job.org. Does not work on `localhost` with an external cron service. For local testing, visit `http://localhost:3000/api/cron/campaigns` manually. See `marketing_readme.md` for full setup.

**TanStack Query DevTools**
Visible in development only (bottom-left floating panel). Shows all cached queries, their status, and data. Use it to debug stale data or unexpected refetches.

**localStorage stores (audit, equipment, outreach)**
These were previously backed by localStorage and have been migrated to Supabase. If a user has stale localStorage data from an old session it will be ignored — the app now reads exclusively from Supabase.

**`initialized` flag pattern**
Some workspace components use a module-level `let initialized = false` flag to prevent double-fetching in React Strict Mode. This is no longer needed now that TanStack Query handles deduplication, but leaving it in place is harmless.