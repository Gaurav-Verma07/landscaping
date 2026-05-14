# Role-Based Access Control — Feature Blueprint
## Landscaping Operations Platform

> **Version:** 1.0 · **Date:** April 2026  
> **Stack:** Next.js · Supabase · Tailwind CSS · shadcn/ui · TanStack Query · Bun

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Role Definitions](#2-role-definitions)
3. [Permission Matrix — Module by Module](#3-permission-matrix--module-by-module)
4. [Data Model](#4-data-model)
5. [Implementation Architecture](#5-implementation-architecture)
6. [UI Behavior Per Role](#6-ui-behavior-per-role)
7. [Use Cases & Scenarios](#7-use-cases--scenarios)
8. [Integration Points with Existing Modules](#8-integration-points-with-existing-modules)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Future Prospects](#10-future-prospects)

---

## 1. Overview & Goals

The platform currently treats every authenticated user as a single class with full access to all modules. As it scales to real crews and supervisors operating in the field, this is both a security risk and a UX problem — crew members shouldn't see invoicing data, supervisors shouldn't be able to delete customer records, and the AI assistant must scope its tool access per caller.

This blueprint defines a **role-based access system** with three primary operational roles (plus the existing Admin/Owner role), maps permissions across every existing module, and specifies the database schema, server-side enforcement strategy, and UI adaptation patterns needed to implement it cleanly without breaking existing features.

### Core Design Principles

- **Server-side enforcement is the source of truth.** UI hiding is UX polish, not security. Every server action and API route must verify role before executing.
- **Roles are additive.** Higher roles include all permissions of lower roles plus extras. No negative grants in the base system.
- **Role is organisation-scoped.** A user can have different roles in different organisations in a future multi-tenant model.
- **The AI assistant inherits the caller's role.** Tool access in `/api/ai/chat` is gated by the authenticated user's role — a crew member using the AI cannot perform supervisor actions.
- **Minimal disruption to existing code.** Role checks are injected as a thin middleware/helper layer on top of existing server actions and the existing TanStack Query hook architecture.

---

## 2. Role Definitions

### Role Hierarchy

```
Owner / Admin
      ↑
  Office Manager
      ↑
   Supervisor
      ↑
 Crew Member
```

### Owner / Admin (`owner`)

The business owner or a designated full-access administrator.

- Unrestricted access to all modules, settings, and data
- Can manage user accounts, assign roles, and revoke access
- Only role that can access billing settings, audit logs, and data retention
- Only role that can delete customers, projects, or financial records
- Can configure AI provider, SMTP, integrations
- Sees all financial data including supplier pricing, invoice totals, and payroll

### Office Manager (`manager`)

Office staff who coordinate operations day-to-day but should not have destructive access.

- Full read/write access to CRM, projects, scheduling, communications, billing
- Can create/edit quotes, invoices, contracts — cannot delete them
- Can view and export audit logs but cannot change retention settings
- Cannot manage user accounts or change role assignments
- Cannot access admin/system settings
- Has full AI assistant access for all read and write operations that are within their own permissions

### Supervisor (`supervisor`)

Field supervisors who manage crew on site and need to update job progress.

- Can view assigned projects and their full details
- Can submit daily progress reports and upload photos
- Can clock crew in/out and issue GPS overrides with reason
- Can view their own crew's time entries; cannot view payroll figures
- Can see their schedule (appointments assigned to them) but not all appointments
- Cannot access CRM, marketing, billing, outreach, or financial data
- Has limited AI assistant access: project status queries, crew queries, navigation
- Cannot create or delete any records — only update status on assigned items

### Crew Member (`crew`)

Field workers. The most restricted role — mobile-first, job-site-only.

- Can view only their own assigned appointments for the day
- Can clock themselves in and out of assigned projects
- Cannot view any other crew member's schedule or time entries
- No access to CRM, billing, quotes, communications, marketing, outreach
- No access to the AI assistant
- UI is stripped to a minimal crew dashboard: today's jobs, clock in/out, their own timesheets
- Cannot access the main sidebar navigation at all

---

## 3. Permission Matrix — Module by Module

Legend: `✅ Full` · `👁 Read only` · `⚡ Partial` (scoped or limited) · `❌ No access`

| Module | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| **A — CRM & Customers** | ✅ Full | ✅ Full | ❌ | ❌ |
| **B — Communications** | ✅ Full | ✅ Full | ❌ | ❌ |
| **C — Lead Generation** | ✅ Full | ✅ Full | ❌ | ❌ |
| **D — Appointments** | ✅ Full | ✅ Full | ⚡ Own assigned only | ⚡ Today's own only |
| **E — Project Management** | ✅ Full | ✅ Full | ⚡ Assigned projects | ❌ |
| **F — Job Board** | ✅ Full | ✅ Full | ⚡ Assigned projects | ❌ |
| **G — Quotes / Contracts / Invoices** | ✅ Full | ⚡ No delete | ❌ | ❌ |
| **H — AI Assistant** | ✅ Full | ✅ Full | ⚡ Projects & crew only | ❌ |
| **I — Labor & Crew** | ✅ Full | ✅ Full | ⚡ Own crew, no payroll | ⚡ Own timesheet only |
| **J — Equipment** | ✅ Full | ✅ Full | 👁 Assigned equipment | ❌ |
| **K — Documents** | ✅ Full | ✅ Full | ⚡ Project docs only | ❌ |
| **L — Design Tool** | ✅ Full | ✅ Full | ❌ | ❌ |
| **M — Search** | ✅ Full | ✅ Full | ⚡ Scoped results | ❌ |
| **N — Admin & Audit** | ✅ Full | 👁 Read only | ❌ | ❌ |
| **O — Marketing** | ✅ Full | ✅ Full | ❌ | ❌ |
| **Settings** | ✅ Full | ⚡ SMTP, profile only | ❌ | ❌ |
| **User Management** | ✅ Full | ❌ | ❌ | ❌ |

### Detailed Permission Breakdown

#### Module A — CRM & Customers

| Action | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| View customer list | ✅ | ✅ | ❌ | ❌ |
| View customer profile | ✅ | ✅ | ❌ | ❌ |
| Create customer | ✅ | ✅ | ❌ | ❌ |
| Edit customer | ✅ | ✅ | ❌ | ❌ |
| Delete customer | ✅ | ❌ | ❌ | ❌ |
| Add notes | ✅ | ✅ | ❌ | ❌ |
| Merge customers | ✅ | ❌ | ❌ | ❌ |
| View customer timeline | ✅ | ✅ | ❌ | ❌ |

#### Module D — Appointments

| Action | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| View all appointments | ✅ | ✅ | ❌ | ❌ |
| View own appointments | ✅ | ✅ | ✅ | ✅ (today only) |
| Create appointment | ✅ | ✅ | ❌ | ❌ |
| Edit appointment | ✅ | ✅ | ❌ | ❌ |
| Delete appointment | ✅ | ✅ | ❌ | ❌ |

#### Module E — Project Management

| Action | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| View all projects | ✅ | ✅ | ❌ | ❌ |
| View assigned projects | ✅ | ✅ | ✅ | ❌ |
| Create project | ✅ | ✅ | ❌ | ❌ |
| Edit project details | ✅ | ✅ | ❌ | ❌ |
| Update project status | ✅ | ✅ | ✅ (assigned) | ❌ |
| Submit daily progress report | ✅ | ✅ | ✅ (assigned) | ❌ |
| Upload project photos | ✅ | ✅ | ✅ (assigned) | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ |
| Manage project timeline | ✅ | ✅ | ❌ | ❌ |

#### Module G — Billing

| Action | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| View quotes | ✅ | ✅ | ❌ | ❌ |
| Create / edit quotes | ✅ | ✅ | ❌ | ❌ |
| Delete quotes | ✅ | ❌ | ❌ | ❌ |
| Accept / reject quotes | ✅ | ✅ | ❌ | ❌ |
| View invoices | ✅ | ✅ | ❌ | ❌ |
| Create / edit invoices | ✅ | ✅ | ❌ | ❌ |
| Delete invoices | ✅ | ❌ | ❌ | ❌ |
| Record payments | ✅ | ✅ | ❌ | ❌ |
| View supplier pricing | ✅ | ✅ | ❌ | ❌ |
| Manage contracts | ✅ | ✅ | ❌ | ❌ |

#### Module I — Labor & Crew

| Action | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| View all employees | ✅ | ✅ | ✅ (own crew) | ❌ |
| View all time entries | ✅ | ✅ | ✅ (own crew) | ❌ |
| View own time entries | ✅ | ✅ | ✅ | ✅ |
| Clock in (any employee) | ✅ | ✅ | ✅ (own crew) | ❌ |
| Clock in (self) | ✅ | ✅ | ✅ | ✅ |
| Clock out (any) | ✅ | ✅ | ✅ (own crew) | ❌ |
| Clock out (self) | ✅ | ✅ | ✅ | ✅ |
| GPS override | ✅ | ✅ | ✅ | ❌ |
| Create employee record | ✅ | ✅ | ❌ | ❌ |
| Edit employee record | ✅ | ✅ | ❌ | ❌ |
| View payroll data | ✅ | ✅ | ❌ | ❌ |

#### Module H — AI Assistant

| Capability | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| Access AI panel | ✅ | ✅ | ✅ | ❌ |
| Customer queries | ✅ | ✅ | ❌ | ❌ |
| Project queries (all) | ✅ | ✅ | ❌ | ❌ |
| Project queries (assigned) | ✅ | ✅ | ✅ | ❌ |
| Invoice / billing queries | ✅ | ✅ | ❌ | ❌ |
| Campaign creation | ✅ | ✅ | ❌ | ❌ |
| Send communications | ✅ | ✅ | ❌ | ❌ |
| Navigation commands | ✅ | ✅ | ✅ | ❌ |
| Crew / schedule queries | ✅ | ✅ | ✅ (own crew) | ❌ |

---

## 4. Data Model

### New Table: `org_members`

Replaces the implicit "one profile = one org" assumption with an explicit membership table.

```sql
CREATE TABLE org_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('owner', 'manager', 'supervisor', 'crew')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by    uuid REFERENCES profiles(id),
  invited_at    timestamptz,
  joined_at     timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (org_id, profile_id)
);

-- Index for fast lookups on role checks in every server action
CREATE INDEX idx_org_members_profile_org ON org_members(profile_id, org_id);
CREATE INDEX idx_org_members_role ON org_members(org_id, role);
```

### New Table: `supervisor_crew`

Links supervisors to the employees they manage. Used for scoped data access.

```sql
CREATE TABLE supervisor_crew (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id    uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id         uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  assigned_at    timestamptz DEFAULT now(),
  UNIQUE (supervisor_id, employee_id)
);
```

### New Table: `project_assignments`

Links supervisors (and optionally crew) to specific projects. Used for scoped project access.

```sql
CREATE TABLE project_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('supervisor', 'crew')),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE (project_id, profile_id)
);
```

### Modified Table: `profiles`

Add a default role field used before org membership is resolved:

```sql
ALTER TABLE profiles ADD COLUMN default_role text DEFAULT 'crew';
```

### RLS Policies

#### `org_members` — only owners can manage

```sql
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own membership record
CREATE POLICY "members_read_own" ON org_members
  FOR SELECT USING (profile_id = auth.uid());

-- Owners can view all members in their org
CREATE POLICY "owners_read_all_members" ON org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.profile_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- Only owners can insert/update/delete
CREATE POLICY "owners_manage_members" ON org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.profile_id = auth.uid()
        AND om.role = 'owner'
    )
  );
```

#### `projects` — supervisors can only see assigned projects

```sql
-- Existing policy selects by profile_id (owner). Extend with union:
CREATE POLICY "supervisor_see_assigned_projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = projects.id
        AND pa.profile_id = auth.uid()
    )
  );
```

#### `time_entries` — crew members see only own entries

```sql
CREATE POLICY "crew_own_time_entries" ON time_entries
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

-- Supervisor sees crew's time entries
CREATE POLICY "supervisor_crew_time_entries" ON time_entries
  FOR SELECT USING (
    employee_id IN (
      SELECT sc.employee_id FROM supervisor_crew sc
      WHERE sc.supervisor_id = auth.uid()
    )
  );
```

---

## 5. Implementation Architecture

### Role Resolution Helper

A shared utility that every server action calls to get the caller's role. Lives in `src/lib/auth/roles.ts`.

```typescript
// src/lib/auth/roles.ts
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'owner' | 'manager' | 'supervisor' | 'crew'

export interface RoleContext {
  userId: string
  orgId: string
  role: UserRole
}

export async function getRoleContext(): Promise<RoleContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) return null
  return { userId: user.id, orgId: membership.org_id, role: membership.role as UserRole }
}

export function requireRole(
  ctx: RoleContext | null,
  allowed: UserRole[]
): void {
  if (!ctx) throw new Error('Unauthorized')
  if (!allowed.includes(ctx.role)) throw new Error(`Forbidden: requires one of [${allowed.join(', ')}]`)
}

export function hasRole(ctx: RoleContext | null, role: UserRole): boolean {
  if (!ctx) return false
  const hierarchy: UserRole[] = ['crew', 'supervisor', 'manager', 'owner']
  return hierarchy.indexOf(ctx.role) >= hierarchy.indexOf(role)
}
```

### Server Action Pattern With Role Check

```typescript
// src/lib/actions/projects.ts  (modified)
'use server'

import { getRoleContext, requireRole } from '@/lib/auth/roles'

export async function deleteProject(id: string) {
  const ctx = await getRoleContext()
  requireRole(ctx, ['owner'])  // only owners can delete

  const supabase = await createClient()
  await supabase.from('projects').delete().eq('id', id)
}

export async function updateProjectStatus(id: string, status: string) {
  const ctx = await getRoleContext()
  requireRole(ctx, ['owner', 'manager', 'supervisor'])

  // Supervisors can only update assigned projects
  if (ctx!.role === 'supervisor') {
    const { data } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', id)
      .eq('profile_id', ctx!.userId)
      .single()
    if (!data) throw new Error('Forbidden: not assigned to this project')
  }

  // ... rest of update logic
}
```

### Middleware: Role in Request Context

To avoid a Supabase round-trip for every role check, cache the role in a request-scoped variable (Next.js server components share a request boundary):

```typescript
// src/lib/auth/role-cache.ts
import { cache } from 'react'
import { getRoleContext } from './roles'

// React cache() deduplicates within a single render pass
export const getCachedRoleContext = cache(getRoleContext)
```

### Client-Side Role Context

Pass role down from the layout server component so client components can adapt UI without an extra fetch:

```typescript
// src/app/dashboard/layout.tsx
const ctx = await getCachedRoleContext()

// Pass to client via a thin context provider
<RoleProvider role={ctx?.role ?? 'crew'}>
  {children}
</RoleProvider>
```

```typescript
// src/lib/auth/role-context.tsx
'use client'
import { createContext, useContext } from 'react'
import type { UserRole } from './roles'

const RoleContext = createContext<UserRole>('crew')

export function RoleProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export const useRole = () => useContext(RoleContext)
export const useIsOwner = () => useRole() === 'owner'
export const useCanAccess = (min: UserRole) => {
  const hierarchy: UserRole[] = ['crew', 'supervisor', 'manager', 'owner']
  const role = useRole()
  return hierarchy.indexOf(role) >= hierarchy.indexOf(min)
}
```

### TanStack Query — Scoped Fetches

Server actions return role-scoped data automatically. The existing hooks require no changes on the client side — scoping happens at the action layer:

```typescript
// src/lib/actions/appointments.ts
export async function getAppointments() {
  const ctx = await getCachedRoleContext()
  const supabase = await createClient()

  let query = supabase.from('appointments').select('*')

  if (ctx?.role === 'supervisor') {
    // Only appointments assigned to this supervisor
    query = query.contains('assigned_user_ids', [ctx.userId])
  } else if (ctx?.role === 'crew') {
    // Only today's appointments assigned to this crew member
    const today = new Date().toISOString().split('T')[0]
    query = query
      .contains('assigned_user_ids', [ctx.userId])
      .gte('start_time', `${today}T00:00:00Z`)
      .lte('start_time', `${today}T23:59:59Z`)
  }
  // owners and managers: no filter, see all
  const { data } = await query.order('start_time', { ascending: true })
  return data ?? []
}
```

### AI Assistant — Role-Scoped Tool Execution

In `src/app/api/ai/chat/route.ts`, pass the role into the tool executor so it can filter tool availability and scope queries:

```typescript
const ctx = await getCachedRoleContext()

// Build a role-aware system prompt
const systemPrompt = buildSystemPrompt({
  companyName: profile.company_name,
  userName: profile.full_name,
  role: ctx?.role ?? 'crew',
  date: new Date().toISOString(),
})

// Pass role to tool executor
const result = await executeTool(toolName, toolInput, { role: ctx?.role })
```

In `src/lib/ai/tool-executor.ts`:

```typescript
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: { role?: UserRole }
) {
  // Block crew from all tools
  if (ctx.role === 'crew') {
    throw new Error('AI assistant not available for crew members')
  }

  // Block supervisor from billing/CRM tools
  const supervisorBlockedTools = [
    'get_customers', 'get_invoices', 'get_quotes',
    'create_campaign', 'send_communication', 'get_campaigns'
  ]
  if (ctx.role === 'supervisor' && supervisorBlockedTools.includes(name)) {
    throw new Error(`Tool ${name} not available for supervisors`)
  }

  // ... rest of tool execution
}
```

### User Management UI

A new admin-only settings section: **Settings → Team**.

```
/dashboard/management/team
├── Member list (name, email, role, status, last active)
├── Invite user (email + role select)
├── Change role (owner-only action)
├── Suspend / remove member
└── Pending invitations
```

Server action to invite:

```typescript
export async function inviteTeamMember(email: string, role: UserRole) {
  const ctx = await getCachedRoleContext()
  requireRole(ctx, ['owner'])

  // 1. Send Supabase magic link invite
  // 2. Create org_members row with status: 'invited'
  // 3. Log to audit table
}
```

---

## 6. UI Behavior Per Role

### Sidebar Navigation

The sidebar renders only routes the current role can access:

```typescript
// src/components/dashboard/layout/app-sidebar.tsx
const { role } = useRole()

const navItems = [
  { href: '/dashboard/customers',     label: 'Customers',    minRole: 'manager' },
  { href: '/dashboard/projects',      label: 'Projects',     minRole: 'supervisor' },
  { href: '/dashboard/appointments',  label: 'Appointments', minRole: 'crew' },
  { href: '/dashboard/crew',          label: 'Crew',         minRole: 'manager' },
  { href: '/dashboard/quotes',        label: 'Quotes',       minRole: 'manager' },
  { href: '/dashboard/invoices',      label: 'Invoices',     minRole: 'manager' },
  { href: '/dashboard/communications',label: 'Comms',        minRole: 'manager' },
  { href: '/dashboard/outreach',      label: 'Outreach',     minRole: 'manager' },
  { href: '/dashboard/marketing',     label: 'Marketing',    minRole: 'manager' },
  { href: '/dashboard/equipment',     label: 'Equipment',    minRole: 'supervisor' },
  { href: '/dashboard/documents',     label: 'Documents',    minRole: 'supervisor' },
  { href: '/dashboard/design',        label: 'Design',       minRole: 'manager' },
  { href: '/dashboard/admin',         label: 'Admin',        minRole: 'owner' },
  { href: '/dashboard/management/team', label: 'Team',       minRole: 'owner' },
].filter(item => canAccess(role, item.minRole))
```

### Crew Dashboard (Role-Specific Route)

Crew members land on a stripped-down page at `/dashboard/crew-home` — not the standard overview:

```
┌────────────────────────────────────────┐
│  Good morning, Marcus                  │
│  Friday, April 3                       │
├────────────────────────────────────────┤
│  📍 TODAY'S JOBS                       │
│  ┌──────────────────────────────────┐  │
│  │  Johnson Property — 8:00 AM      │  │
│  │  143 Oak St · Lawn installation  │  │
│  │  [CLOCK IN]                      │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Williams Property — 1:00 PM     │  │
│  │  72 Pine Ave · Mulch delivery    │  │
│  │  [CLOCK IN]                      │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  ⏱ MY HOURS THIS WEEK: 24.5 hrs       │
│  [View my timesheet]                  │
└────────────────────────────────────────┘
```

No sidebar navigation. No AI button. Clock in/out flow is the same `ClockInDialog` component, already built.

### Supervisor Dashboard

Supervisors see a project-centric view:

```
┌────────────────────────────────────────────────────────┐
│  My Projects (3 active)                                │
├──────────────┬─────────────────────────────────────────┤
│  Sidebar:    │  [PROJECT CARD: Johnson]                │
│  My Projects │    Status: In Progress                  │
│  My Crew     │    Crew: 4 assigned                     │
│  Schedule    │    [Submit Daily Report] [View GPS]     │
│              │                                         │
│              │  [PROJECT CARD: Williams]               │
│              │    Status: Scheduled                    │
│              │    Crew: 2 assigned                     │
│              │    [Submit Daily Report]                │
└──────────────┴─────────────────────────────────────────┘
```

### Action Button Visibility

Use the `useCanAccess` hook to conditionally render destructive or privileged actions:

```tsx
// Any component
const canDelete = useCanAccess('owner')
const canEdit   = useCanAccess('manager')

return (
  <>
    {canEdit && <Button onClick={onEdit}>Edit</Button>}
    {canDelete && <Button variant="destructive" onClick={onDelete}>Delete</Button>}
  </>
)
```

### Command Menu Scoping

The `CommandMenu` (Cmd+K) should only surface routes and actions the current role can access — filter the command list by `minRole` the same way the sidebar does.

---

## 7. Use Cases & Scenarios

### Scenario 1 — New Crew Member Onboarding

1. Owner opens **Settings → Team** → clicks **Invite Member**
2. Enters email `marcus@example.com`, selects role `Crew`
3. Marcus receives a magic link email
4. Marcus clicks link, sets password, lands on the crew dashboard
5. Marcus sees only today's assigned jobs and a clock-in button
6. Owner assigns Marcus to a project via **Project → Crew Assignment**
7. Next day Marcus's jobs appear automatically based on his appointment assignments

### Scenario 2 — Supervisor Managing a Job Site

1. Supervisor Maria clocks into `/dashboard` — sees her 2 active projects
2. She taps "Johnson Property" → sees project details, crew list, timeline
3. She opens the **Daily Report** form, fills in progress notes, uploads 3 photos
4. She sees one crew member clocked in from an off-site location (red GPS badge)
5. She clicks **Override**, enters reason "drove to material pickup first"
6. The override is logged with her name, timestamp, and reason
7. She asks the AI: *"Which crew members are clocked in right now on Johnson?"*
8. AI responds with a list of names and clock-in times — billing data is not shown

### Scenario 3 — Manager Creating a Quote

1. Manager Alex visits a customer, takes measurements
2. Opens app on laptop → navigates to **Customers → Smith, John**
3. Creates a new quote with AI assistance — AI reads plant catalog and suggests line items
4. Sends quote to customer via the platform
5. Customer approves → Alex accepts quote → project is auto-created
6. Alex cannot delete the customer record (delete button absent from her view)
7. Alex cannot access audit log settings (route is blocked both in nav and server-side)

### Scenario 4 — Owner Reviewing Audit Trail

1. A supervisor submitted an override with a vague reason
2. Owner opens **Admin → Audit Log**
3. Filters by `supervisor_override` event type
4. Sees: `Maria T · Override on time_entry #4821 · "Driver pickup" · April 3 14:22`
5. Owner reviews the GPS coordinates and confirms it was legitimate
6. If suspicious, owner can suspend Maria's account from **Settings → Team**

### Scenario 5 — AI Assistant Respects Role Boundaries

1. Supervisor asks AI: *"Show me the invoice for the Smith project"*
2. AI responds: *"I don't have access to billing information in your role. I can show you project status, crew assignments, and schedule for the Smith project if that would help."*
3. Supervisor asks: *"Which crew members are scheduled for Smith tomorrow?"*
4. AI fetches from the scoped `project_assignments` and `appointments` tables and responds correctly
5. Supervisor tries to ask AI to *"Send an email to the customer"*
6. AI responds: *"Sending communications isn't available in your current role. Please contact your manager."*

### Scenario 6 — Role Escalation Request

1. Supervisor Maria needs to access a quote to discuss it with a customer on-site
2. She messages the owner via the platform's communications channel
3. Owner temporarily promotes her to `manager` via **Settings → Team → Change Role**
4. Maria's next page load reflects the new role (cached role context refreshes on navigation)
5. After the meeting, owner reverts her role to `supervisor`
6. All role changes are logged in the audit table with `changed_by` and timestamp

---

## 8. Integration Points with Existing Modules

### GPS Monitoring (already built)

The existing supervisor override flow already captures `override_by` (profile ID). Post-RBAC, the server action `supervisorOverride()` in `lib/actions/labor.ts` simply adds:

```typescript
requireRole(ctx, ['owner', 'manager', 'supervisor'])
```

No other changes needed — the data model is already role-aware.

### AI Assistant

The agentic loop in each provider (`anthropic.ts`, `gemini.ts`, `openai.ts`) runs up to 10 iterations. Role enforcement happens at the `executeTool()` boundary — the loop itself is unaffected. The system prompt (`system-prompt.ts`) receives the role string and includes it in the persona context so the AI can explain its own limitations naturally.

### TanStack Query Cache

Because role-scoped data is returned from server actions (not filtered on the client), the existing `queryKey` hierarchy works unchanged. A supervisor's `['projects']` cache entry contains only their assigned projects — the same key, different data. No cache key changes required.

### Audit Module

All role-change events, failed permission checks, and override actions should write to the audit log. Extend the existing `audit.ts` server action:

```typescript
export async function logRoleChange(targetId: string, oldRole: string, newRole: string) {
  // existing audit log pattern
}
```

### Design Tool

The design tool (`/dashboard/design`) is a manager+ feature. Supervisors have no design access, but they can view a **read-only preview** of a design linked to their assigned project — accessed from the project detail page, not the design index.

### Communications Module

Supervisors cannot access the communications inbox. However, the platform's automated messaging (appointment reminders, daily report reminders) can still send messages *to* supervisors. This is a server-side trigger — it doesn't require UI access.

### Marketing Campaigns

The AI can create campaigns for `owner` and `manager` roles. The `create_campaign` tool in `tools-campaigns.ts` calls a server action that already checks `profile_id` — adding `requireRole(ctx, ['owner', 'manager'])` is the only change needed.

---

## 9. Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)

**Database**
- Create `org_members`, `supervisor_crew`, `project_assignments` tables
- Write RLS policies for each table
- Migration: backfill existing `profiles` records to `org_members` with role `owner`

**Server-side enforcement**
- Build `src/lib/auth/roles.ts` with `getRoleContext`, `requireRole`, `hasRole`
- Build `src/lib/auth/role-cache.ts` with React `cache()` wrapper
- Build `src/lib/auth/role-context.tsx` — `RoleProvider`, `useRole`, `useCanAccess`
- Wire `RoleProvider` into `app/dashboard/layout.tsx`

**Delivery:** All existing functionality works. Owners are the only role. Role infrastructure exists but no restrictions enforced yet.

### Phase 2 — Enforcement on Critical Paths (Week 3)

- Add `requireRole()` to all destructive server actions (delete, bulk delete)
- Add `requireRole()` to billing module actions (invoices, quotes, contracts)
- Add role scoping to `getProjects()`, `getAppointments()`, `getTimeEntries()`
- Block AI tools by role in `tool-executor.ts`
- Update system prompt to include role context

**Delivery:** Owner-only and manager-only restrictions enforced server-side and client-side.

### Phase 3 — Supervisor & Crew UX (Week 4)

- Build crew home page (`/dashboard/crew-home`) with today's jobs and clock-in
- Build supervisor dashboard variant (filtered project list + daily report quick-access)
- Sidebar navigation filtering via `minRole` per item
- Command menu filtering
- AI assistant blocked for crew, scoped for supervisors
- `ClockInDialog` crew-mode (self-only, no employee dropdown)

**Delivery:** Supervisors and crew members get usable, appropriate UIs.

### Phase 4 — Team Management UI (Week 5)

- New route: `/dashboard/management/team`
- Member list with role badges and status
- Invite flow (email + role + Supabase auth invite)
- Change role (owner-only)
- Suspend / reactivate member
- Pending invitations list
- Audit log entries for all team changes

**Delivery:** Owners can fully manage their team from within the platform.

---

## 10. Future Prospects

### Near-Term (1–3 months)

**Custom Roles**  
Let owners define custom roles beyond the four preset ones. A "Sales Rep" role might have CRM read/write but no billing access. Stored as a `custom_roles` table with a JSON permissions map.

**Per-Project Role Override**  
Allow a manager to be designated as a "project lead" on a specific project, giving them temporary elevated access to billing data for that project only. Useful for large jobs where one manager owns client communications end-to-end.

**Granular Permission Toggles**  
Below role level, add boolean toggles per member: `can_send_campaigns`, `can_view_payroll`, `can_approve_overrides`. Useful for organizations where roles don't map cleanly to the preset hierarchy.

**Two-Factor Auth Requirement Per Role**  
Require MFA for owner and manager roles. Enforce at the middleware level before the role context is resolved.

### Medium-Term (3–6 months)

**Crew Mobile App (PWA)**  
The crew dashboard is already minimal enough to be a PWA. Add to home screen support, push notifications for appointment reminders, and background geolocation for continuous GPS tracking. RBAC makes this safe — the PWA only ever sees crew-scoped data.

**Supervisor Shift Reports Dashboard**  
A dedicated view (owner/manager only) showing all supervisors' daily report submissions across all active projects in a single feed. Filter by date, project, or supervisor. Flag missing submissions automatically.

**Role-Scoped AI Personas**  
The supervisor AI persona is trained differently from the manager AI persona. Supervisors get a field-ops assistant ("Can I reschedule the morning crew?"), managers get a business ops assistant ("What's the revenue this month?"). Same underlying model, different system prompt and tool availability.

**Audit Log Role Filtering**  
The existing audit log gains a `performed_by_role` column. Owners can filter the audit log by role to review what supervisors have been overriding, or what the AI assistant has been executing on behalf of managers.

**Time-Based Role Access**  
Crew members can only clock in during a defined time window (e.g. 6 AM–8 PM). Supervisors can only submit daily reports before a daily cutoff time. Configurable per org in settings.

### Long-Term (6–12 months)

**Multi-Organisation Support**  
A user (e.g. a subcontractor) can belong to multiple organisations with different roles in each. The `org_members` schema already supports this — the UI needs an org-switcher in the header and the role context resolves per selected org.

**Client Portal Role**  
A `client` role that gives customers read-only access to their own project status, design, and invoice history. They never see other customers' data. Authentication via magic link. This is a significant UX build but the RBAC infrastructure is already in place.

**Field Technician Role**  
A hybrid between crew and supervisor: can view project details and materials list for assigned jobs, can add notes and photos, but cannot manage other crew. Useful for solo operators or licensed technicians.

**Delegated Admin**  
An owner can designate another `owner`-role user as a co-admin for a specific time window (e.g. while on holiday). Scoped delegation with an expiry — automatically reverts after the window. Logged in audit.

**SCIM / SSO Integration**  
For larger landscaping companies (20+ employees), integrate with Google Workspace or Microsoft Entra for SSO. Role assignments can be sourced from directory groups. A "Supervisor" maps to an Active Directory "Field Team" group.

---

## Appendix A — Role Quick Reference Card

| I want to... | Owner | Manager | Supervisor | Crew |
|---|---|---|---|---|
| Add a new customer | ✅ | ✅ | ❌ | ❌ |
| Send a quote | ✅ | ✅ | ❌ | ❌ |
| Create an invoice | ✅ | ✅ | ❌ | ❌ |
| Delete an invoice | ✅ | ❌ | ❌ | ❌ |
| View my appointments | ✅ | ✅ | ✅ | ✅ |
| See all appointments | ✅ | ✅ | ❌ | ❌ |
| Submit daily site report | ✅ | ✅ | ✅ | ❌ |
| Clock in to a project | ✅ | ✅ | ✅ | ✅ |
| Override a GPS flag | ✅ | ✅ | ✅ | ❌ |
| Invite team members | ✅ | ❌ | ❌ | ❌ |
| Change someone's role | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | 👁 | ❌ | ❌ |
| Use AI assistant | ✅ | ✅ | ⚡ | ❌ |
| Create a campaign | ✅ | ✅ | ❌ | ❌ |
| Access design tool | ✅ | ✅ | ❌ | ❌ |
| View supplier pricing | ✅ | ✅ | ❌ | ❌ |

---

## Appendix B — Files to Create / Modify

### New Files

| File | Purpose |
|---|---|
| `src/lib/auth/roles.ts` | Role type, `getRoleContext`, `requireRole`, `hasRole` |
| `src/lib/auth/role-cache.ts` | React `cache()` wrapper for deduplication |
| `src/lib/auth/role-context.tsx` | Client `RoleProvider`, `useRole`, `useCanAccess` |
| `src/app/dashboard/crew-home/page.tsx` | Crew-only stripped dashboard |
| `src/components/dashboard/crew/crew-home.tsx` | Crew dashboard component |
| `src/app/dashboard/management/team/page.tsx` | Team management page |
| `src/components/dashboard/team/team-workspace.tsx` | Member list + invite |
| `src/components/dashboard/team/invite-member-dialog.tsx` | Invite flow |
| `src/lib/actions/team.ts` | Invite, change role, suspend server actions |
| `supabase/migrations/xxxx_rbac.sql` | `org_members`, `supervisor_crew`, `project_assignments` tables + RLS |

### Modified Files

| File | Change |
|---|---|
| `src/app/dashboard/layout.tsx` | Add `RoleProvider`, resolve role server-side |
| `src/components/dashboard/layout/app-sidebar.tsx` | Filter nav items by `minRole` |
| `src/components/dashboard/layout/command-menu.tsx` | Filter commands by role |
| `src/lib/actions/projects.ts` | Add `requireRole` + supervisor scoping |
| `src/lib/actions/labor.ts` | Add `requireRole` + crew scoping on `clockIn` |
| `src/lib/actions/billing.ts` | Add `requireRole(['owner', 'manager'])` on all billing actions |
| `src/lib/actions/customers.ts` | Add `requireRole` — delete only for owner |
| `src/lib/actions/appointments.ts` | Scope by role in query |
| `src/lib/ai/tool-executor.ts` | Block tools by role |
| `src/lib/ai/system-prompt.ts` | Include role in persona context |
| `src/app/api/ai/chat/route.ts` | Pass role context to tool executor |

---

*Blueprint v1.0  · RBAC Feature · April 2026*