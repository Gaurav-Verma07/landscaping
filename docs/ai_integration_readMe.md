# AI Assistant — Integration Guide

AI-powered business operations co-pilot built into the Landscaping Platform. Reads live business data, navigates the app, drafts actions, and executes them with user approval.

---

## Table of contents

1. [Setup](#setup)
2. [Architecture](#architecture)
3. [Switching AI providers](#switching-ai-providers)
4. [Features](#features)
5. [Use cases](#use-cases)
6. [Approval flow](#approval-flow)
7. [Security model](#security-model)
8. [Future prospects](#future-prospects)
9. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Install dependencies

```bash
bun add @anthropic-ai/sdk openai @google/generative-ai
```

### 2. Environment variables

Add to `.env.local`:

```env
# AI provider — anthropic | openai | gemini (default: anthropic)
AI_PROVIDER=gemini

# API keys — only the active provider's key is required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Optional — override the default model for the active provider
# AI_MODEL=gemini-2.0-flash
# AI_MODEL=claude-sonnet-4-20250514
# AI_MODEL=gpt-4o-mini
```

### 3. File placement

```
src/
├── app/
│   └── api/ai/chat/
│       └── route.ts                 ← API route (auth + streaming)
├── lib/
│   ├── ai/
│   │   ├── index.ts                 ← single export point
│   │   ├── provider.interface.ts    ← AIProvider contract
│   │   ├── provider.factory.ts      ← reads AI_PROVIDER env var
│   │   ├── system-prompt.ts         ← user-scoped system prompt
│   │   ├── tool-executor.ts         ← executes tools server-side
│   │   ├── providers/
│   │   │   ├── anthropic.ts         ← Claude implementation
│   │   │   ├── openai.ts            ← GPT implementation
│   │   │   └── gemini.ts            ← Gemini implementation
│   │   └── tools/
│   │       ├── index.ts             ← combined tool export
│   │       ├── customers.ts
│   │       ├── campaigns.ts
│   │       ├── communications.ts
│   │       ├── projects.ts
│   │       └── navigation.ts
│   └── hooks/
│       └── use-ai-chat.ts           ← client-side chat hook
└── components/dashboard/ai/
    ├── ai-panel.tsx                 ← side panel UI
    ├── ai-chat-message.tsx          ← message bubbles + approval cards
    ├── ai-chat-input.tsx            ← input bar
    ├── ai-panel-provider.tsx        ← context provider (open/close state)
    └── ai-toggle-button.tsx         ← header toggle button
```

### 4. Wire up the toggle button

In `src/components/dashboard/layout/dashboard-header.tsx`, add:

```tsx
import { AIToggleButton } from '@/components/dashboard/ai/ai-toggle-button'

// Inside the header actions row:
<AIToggleButton />
```

### 5. Verify layout.tsx

The dashboard layout must include `AIPanelProvider`:

```tsx
import { AIPanelProvider } from '@/components/dashboard/ai/ai-panel-provider'

<QueryProvider>
  <AIPanelProvider>
    <SidebarProvider>
      ...
    </SidebarProvider>
  </AIPanelProvider>
</QueryProvider>
```

---

## Architecture

```
User types message
      ↓
POST /api/ai/chat  (session verified server-side)
      ↓
buildSystemPrompt()  (company name, user, role, date)
      ↓
provider.chat()  (Gemini / Claude / GPT)
      ↓
AI decides to call a tool
      ↓
executeTool()  (server-side, scoped to user's data)
      ↓
Full dataset returned to AI
      ↓
AI reasons over data → writes response
      ↓
Streamed back to client (SSE)
      ↓
Client renders text / navigation / approval card
```

### Agentic loop

Each provider runs an internal loop — up to 10 iterations:

```
1. Send messages to AI
2. AI returns text or tool calls
3. If tool calls → execute all tools → feed results back
4. If requires_approval → stop loop, show approval card to user
5. If no tool calls → stream final response → done
```

This means the AI can chain multiple tools in a single turn:
- Fetch customers → filter → fetch their invoices → summarise everything

### Tool results

Tools return **full datasets** with all fields. This means:
- The AI has complete data in context after one tool call
- Follow-up questions ("now filter by status", "which one has the most notes") are answered instantly without a second tool call
- Summaries and analysis work because the full body/content is returned, not just metadata

---

## Switching AI providers

Change one environment variable — no code changes needed:

```env
AI_PROVIDER=anthropic   # Claude Sonnet (default)
AI_PROVIDER=openai      # GPT-4o mini
AI_PROVIDER=gemini      # Gemini 2.0 Flash
```

Optionally override the model within the provider:

```env
AI_PROVIDER=anthropic
AI_MODEL=claude-opus-4-6  # use a more powerful model
```

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-pro   # use a more capable Gemini model
```

### Provider defaults

| Provider | Default model | Input cost/1M | Output cost/1M |
|---|---|---|---|
| `anthropic` | claude-sonnet-4-20250514 | $3 | $15 |
| `openai` | gpt-4o-mini | $0.25 | $2 |
| `gemini` | gemini-2.0-flash | $0.50 | $3 |

---

## Features

### Read & analyse (no approval needed)

- List, filter, and search any module — customers, projects, invoices, campaigns, communications, appointments
- Summarise message threads and communication history
- Count and compare records across any field
- Cross-reference data — e.g. "which customers have overdue invoices"
- Complex natural language queries over live data

### Write with approval

All write operations show an approval card before executing. Nothing is written without explicit user confirmation.

- Create email campaigns with audience targeting and scheduling
- Send communications (email/SMS) to any customer
- Send existing campaigns immediately

### Navigation

- Open any module by name
- Jump directly to specific pages

### Persona

- Presents as the company's own assistant
- System prompt includes company name, user name, role, and current date/time
- Never mentions the underlying AI provider
- Responds in the company's voice

---

## Use cases

### Customer queries

```
"list all active customers"
"find customers who work at 8 Corp"
"which customers are leads from LinkedIn?"
"give me details of John Doe"
"how many customers do we have by status?"
"which customer has the most notes?"
```

### Communications

```
"summarise all unread messages"
"what did John Doe's last email say?"
"show me all inbound emails from this week"
"draft a reply to Sarah asking for a site visit"
"send an email to John asking him to buy more products"
```

### Projects & invoices

```
"which projects are currently in progress?"
"show me all overdue invoices"
"what's the total value of unpaid invoices?"
"which projects are scheduled for next week?"
"find all high priority projects"
```

### Campaigns

```
"show me all sent campaigns"
"create a campaign for active customers asking for reviews, send at 1pm tomorrow"
"what was the open rate on our last campaign?"
"create a seasonal spring campaign for all customers"
```

### Navigation

```
"open marketing"
"go to customers"
"take me to communications settings"
"open the appointments page"
```

### Cross-module queries

```
"which active customers don't have any appointments scheduled?"
"show me customers with overdue invoices and their contact details"
"which customers received our last campaign?"
"summarise all communications with John Doe across all channels"
```

---

## Approval flow

Write operations always require explicit confirmation before executing.

**Flow:**

1. User asks AI to do something that writes data
2. AI fetches any needed context (e.g. customer details, existing campaigns)
3. AI proposes the action with a preview card showing exactly what will happen
4. User clicks **Confirm** or **Cancel**
5. On confirm — action executes server-side and result is shown

**Approval card shows:**
- Exact action to be taken
- All relevant details (recipient, subject, body, audience, schedule)

**Triggers approval:**
- `create_campaign` — shows name, subject, audience, scheduled time
- `send_campaign` — shows campaign ID and recipient count
- `send_communication` — shows channel, recipient, subject, full message body

**Does NOT trigger approval (safe reads):**
- Any `get_*` tool
- `navigate_to`
- `draft_reply`

---

## Security model

| Concern | Solution |
|---|---|
| Cross-user data access | Session verified server-side on every request. All Supabase queries scoped to `profile_id = auth.uid()` |
| API key exposure | Keys only used in `/api/ai/chat` server route. Never sent to the client |
| Accidental writes | All mutations require explicit user confirmation via approval card |
| Invalid UUIDs | Tool executor resolves customer names to real UUIDs automatically — AI never needs to pass raw database IDs |
| Rate limiting | `maxDuration = 60` on the route. Agentic loop capped at 10 iterations |
| Provider lock-in | Provider abstraction layer — switch via env var with zero code changes |

---

## Future prospects

### Phase 3 — Proactive intelligence
- **Daily briefing** — on first login, AI summarises overnight messages, overdue invoices, and today's appointments
- **Invoice alerts** — auto-notify when invoices go overdue, suggest follow-up message
- **Suggested replies** — AI pre-drafts a reply for each unread inbound message
- **Lead scoring** — AI analyses prospect engagement and recommends who to follow up with

### Voice integration (ElevenLabs + AI)
- ElevenLabs handles speech-to-text and text-to-speech
- Transcribed text is passed to the AI as a normal message
- AI response is read aloud via ElevenLabs TTS
- Full hands-free operation while on a job site

### Expanded tool coverage
- Create and update projects
- Schedule appointments
- Create invoices and record payments
- Update customer status and notes
- Bulk operations ("mark all these invoices as sent")

### Conversation memory
- Store conversation summaries in Supabase per user
- AI remembers context from previous sessions
- "Last time you asked about overdue invoices — there are 3 new ones"

### Multi-turn task execution
- Break complex tasks into steps and confirm each individually
- "Schedule follow-up emails for all leads who haven't responded in 7 days" → AI lists candidates → user approves → sends

### Analytics & reporting
- "Generate a monthly revenue summary"
- "Which services are most profitable this quarter?"
- "Create a report on crew utilisation for last month"

### Crew & equipment AI
- Crew scheduling suggestions based on project load
- Equipment conflict detection
- Time entry anomaly detection

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| AI says "Done." without a real response | Tool result not fed back to AI (old provider version) | Replace `anthropic.ts` / `gemini.ts` with the agentic loop versions |
| `invalid input syntax for type uuid` | AI passing customer name as UUID | Replace `tool-executor.ts` — name resolution is now automatic |
| `foreign key constraint` error on send | Same UUID issue | Same fix as above |
| AI says it cannot summarise data | System prompt not explicit enough | Replace `system-prompt.ts` |
| AI calls the same tool repeatedly | Gemini / GPT not seeing tool results | Ensure provider has the agentic loop with `functionResponse` / tool result messages |
| `FunctionDeclarationSchemaType` not found | Outdated `@google/generative-ai` SDK | Change import to `SchemaType` from `@google/generative-ai` |
| Panel doesn't open | `AIPanelProvider` missing from layout | Add `<AIPanelProvider>` above `<SidebarProvider>` in `layout.tsx` |
| 401 Unauthorized | Session not passed to API route | Ensure `createClient()` from `@/lib/supabase/server` is used in the route |
| Streaming stops mid-response | `maxDuration` too short | Increase `export const maxDuration = 60` in route |