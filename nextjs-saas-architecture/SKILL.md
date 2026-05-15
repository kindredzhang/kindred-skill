## Overview

Complete Next.js SaaS architecture reference covering the full 0→1 lifecycle. Each phase corresponds to a stage in building a SaaS application. Use the patterns for architecture decisions, the reference files for concrete implementation code.

### Quick Reference by Domain

| If asked about... | Go to Phase... |
|---|---|
| Project setup, config | Phase 1 |
| Folder structure | Phase 2 |
| Routing, layouts | Phase 3 |
| Internationalization | Phase 4 |
| Authentication | Phase 5 → [references/auth.md](references/auth.md) |
| Database | Phase 6 |
| Admin CRUD, data tables | Phase 7 → [references/slot-architecture.md](references/slot-architecture.md) |
| Landing page | Phase 8 |
| Stripe payments | Phase 9 → [references/payment.md](references/payment.md) |
| AI integration | Phase 10 |
| Theme, dark mode | Phase 11 |
| Icons, caching, API format | Phase 12 |

---

## Phase 1: Project Initialization

### Stack Foundation
```
Next.js 15 + App Router + Turbopack + TypeScript + Tailwind CSS + shadcn/ui
```

### Key Config Decisions

**next.config.mjs** — set `output: "standalone"` from day one. This enables Docker deployment without later rewrites. Enable MDX (`@next/mdx`) for legal/marketing content. Bundle analyzer behind `ANALYZE=true` env flag.

**Tailwind config** — use shadcn/ui's CSS variable theming (not hardcoded colors). Define colors as `hsl(var(--variable-name))` in tailwind.config.ts, set HSL values in theme.css. This makes dark/light mode a single CSS class toggle.

**Aliases** — set consistent imports in `components.json`: `@/components/ui` for primitives, `@/lib/utils`, `@/hooks`.

→ See [references/project-init.md](references/project-init.md) for full config files

---

## Phase 2: Folder Structure Convention

### The Pattern
Separate code by **layer** (not by feature) at the top level:

```
src/ or root/
├── app/                    # Routes + API (App Router file system)
│   ├── [locale]/           # i18n param segment
│   │   ├── (default)/      # Public shell (header + footer)
│   │   │   └── (console)/ # User console (auth-gated, simple sidebar)
│   │   └── (admin)/        # Admin panel (auth+role-gated, sidebar)
│   ├── (legal)/            # Bypasses i18n, pure MDX
│   └── api/                # Route handlers (outside [locale])
├── auth/                   # NextAuth v5 config + session provider
├── components/
│   ├── blocks/             # Landing page sections (data-driven)
│   ├── console/            # User console layout + slot wrappers
│   ├── dashboard/          # Admin layout + sidebar + slot wrappers
│   ├── ui/                 # shadcn/ui primitives
│   └── sign/               # Auth modal (responsive Dialog/Drawer)
├── contexts/               # React Contexts (AppContext)
├── hooks/                  # Custom hooks
├── i18n/                   # next-intl: routing, messages JSON
│   ├── messages/           # UI label translations
│   └── pages/              # Page content per locale
├── lib/                    # Pure utilities (cn, cache, resp, time)
├── models/                 # Data access layer (Supabase queries only)
├── services/               # Business logic layer (orchestration)
├── types/                  # TypeScript definitions
│   ├── blocks/             # Landing page block types
│   └── slots/              # Table/Form slot types
└── providers/              # React providers (ThemeProvider)
```

### Why This Layout
- **models/ + services/ split** — models are pure data access (SELECT/INSERT/UPDATE). Services orchestrate: auth check → validate → model call → side effects. Keeps data access testable and business logic auditable.
- **types/ outside components/** — pages and components share type contracts without circular imports.
- **blocks/ as flat directory** — each landing page section is a self-contained component subfolder (hero/, pricing/, faq/).

---

## Phase 3: Route Group Architecture (Multi-Layer Layout)

### The Concept
Route groups `(name)` stack layouts without affecting the URL. Build a **progressive layout system**:

```
Layer 0: (legal)              No shell, no i18n, pure MDX, own <html>
Layer 1: [locale]             Root layout — provider chain
Layer 2: (default)            Public shell — Header + Footer + Feedback
Layer 3a: (default)/(console) User console — auth gate + simple sidebar
Layer 3b: (admin)             Admin panel — auth+role gate + shadcn sidebar
```

### The Provider Chain
Each provider is ordered by dependency:
```
NextIntlClientProvider       # i18n — outermost, all children can use t()
  NextAuthSessionProvider    # Auth — useSession() needed by AppContext
    AppContextProvider       # Global state — user, sign modal, theme, feedback
      ThemeProvider          # next-themes — also renders modals, analytics, toaster
```

**Why this order:**
1. **NextIntlClientProvider** outermost so every child can call `useTranslations()`
2. **NextAuthSessionProvider** second — `AppContext` calls `useSession()` to trigger user info fetch
3. **AppContextProvider** third — owns global state (`user`, `showSignModal`, `theme`). On session change, fetches `/api/get-user-info` and sets user
4. **ThemeProvider** innermost — renders the `ThemeProvider` + global UI (sign modals, toaster, analytics components). Uses `forcedTheme` from AppContext to sync

Provider chain ordering is intentional — each provider depends on the infrastructure set up by the one above it.

### Middleware Strategy
API routes and legal pages are excluded from i18n middleware via regex matcher. API routes sit outside `[locale]` so they never get locale prefix rewriting.

### Applicability
- Use route groups when you have 3+ distinct UI zones (public/authenticated/admin)
- Skip if your app has only public pages — the overhead isn't worth it
- Auth gates at layout level means no per-page auth checks

---

## Phase 4: Internationalization (next-intl)

### Locale Strategy
```
localePrefix: "as-needed"    # /about for default, /zh/about for others
localeDetection: <env var>   # Toggle-able at deploy time
```

`as-needed` is cleaner for SEO — the default locale has no URL prefix.

### Two-Level i18n
Use parallel i18n systems, not one unified file:
1. **`i18n/messages/*.json`** — UI labels (button text, form labels). Accessed via `useTranslations()` / `getTranslations()`.
2. **`i18n/pages/landing/*.json`** — Landing page content (hero, features, pricing). Loaded independently with English fallback.

This separation keeps landing page content (rich text, pricing tables) from bloating the UI messages bundle.

---

## Phase 5: Authentication (NextAuth v5)

### Conditional Provider Registration
Auth providers registered based on env vars, not code branches:
```ts
if (process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true") {
  providers.push(GoogleProvider({...}));
}
```
This means auth features can be toggled at deploy time without code changes.

### JWT Session Strategy
Store `{ uuid, email, nickname, avatar_url, created_at }` in the JWT token via the `jwt` callback. On sign-in, create or find the user in Supabase and enrich the token. The `session` callback maps token data to `session.user`.

### Dual Auth: Session + API Keys
`getUserUuid()` checks two sources:
1. `Authorization: Bearer sk-...` header (API key)
2. NextAuth session cookie

This makes API routes work for browser users (cookie) and external clients (API key) through the same service function.

### Auth-Protected Layouts
- Console: redirect to `/auth/signin` if no user
- Admin: render "No access" if email not in `ADMIN_EMAILS`
- Both call `getUserInfo()` which calls `getUserUuid()`

→ See [references/auth.md](references/auth.md) for full NextAuth config, session provider, `getUserUuid()`, and One Tap login

---

## Phase 6: Database Layer (Supabase + Models/Services Split)

### Three-Layer Architecture
```
API Route (thin HTTP boundary)
  → Services (business logic, auth checks, orchestration)
    → Models (pure data access — Supabase queries)
```

**Models** are pure data access. No auth, no business logic:
```ts
// models/user.ts
export async function findUserByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users").select("*").eq("email", email).single();
  if (error) return undefined;
  return data;
}
```

**Services** orchestrate. They call models, check auth, enforce rules:
```ts
// services/user.ts
export async function saveUser(user: User) {
  const existUser = await findUserByEmail(user.email);
  if (!existUser) {
    await insertUser(user);
    await increaseCredits({...}); // Side effect: new user bonus
  }
  return user;
}
```

### Supabase Client Strategy
`getSupabaseClient()` prefers `SUPABASE_SERVICE_ROLE_KEY` over `SUPABASE_ANON_KEY`. Auth/authorization happens in the services layer, not in Supabase RLS. Tradeoff: more application code, but debuggable and portable to other databases.

→ See [references/project-init.md](references/project-init.md) for `getSupabaseClient()` and API envelope utilities

---

## Phase 7: Data-Driven UI — Slot Architecture

The most important pattern. Instead of writing JSX for every CRUD page, pages are **declared as TypeScript configuration objects**.

### Table Slot
```tsx
const table: TableSlotType = {
  title: "All Users",
  columns: [
    { name: "uuid", title: "UUID" },
    { name: "email", title: "Email" },
    { name: "avatar_url", title: "Avatar",
      callback: (row) => <img src={row.avatar_url} className="w-10 h-10 rounded-full" /> },
    { name: "created_at", title: "Created",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD") },
  ],
  data: users,
};
return <TableSlot {...table} />;
```

### Form Slot
```tsx
const form: FormSlotType = {
  title: "Add Post",
  fields: [
    { name: "title", type: "text", validation: { required: true } },
    { name: "content", type: "markdown_editor" },
  ],
  submit: {
    handler: async (data: FormData) => {
      "use server";
      await insertPost({...});
      return { status: "success", redirect_url: "/admin/posts" };
    },
  },
};
return <FormSlot {...form} />;
```

### Two Variants
- **Dashboard slots**: full-page layout with shadcn `SidebarInset` (for admin)
- **Console slots**: compact card layout (for user-facing pages)

Both share the same type definitions and underlying block renderers. Only the wrapper layout differs.

### Validation
Validation rules (`required`, `min`, `max`, `email`) on form fields are compiled into Zod schemas automatically. No manual Zod definitions per form.

### When to Use / Not Use
**Use**: Admin panels, CRUD pages, user settings — anywhere consistency matters.
**Avoid**: Highly interactive pages, unique visual designs, landing pages (use Blocks instead).

→ See [references/slot-architecture.md](references/slot-architecture.md) for full type definitions, field types, and slot wrapper components

---

## Phase 8: Landing Page — Blocks System

### The Concept
Landing page sections are **pure presentational components** rendered from locale-specific JSON. The page is a simple render loop:

```tsx
{page.hero && <Hero hero={page.hero} />}
{page.feature && <Feature section={page.feature} />}
{page.pricing && <Pricing pricing={page.pricing} />}
```

Every block checks a `disabled` flag — toggle sections on/off without touching code.

### Block Types
- **Hero** — headline, gradient highlight, CTA buttons, announcement badge, social proof
- **Section** (generic) — title, description, grid of items — used for Features, Benefits, Stats, FAQ, Testimonials, CTA
- **Pricing** — tier cards with monthly/yearly toggle, feature lists, Stripe checkout integration
- **Footer** — multi-column nav, brand info, social icons, legal links

### Content Source
Content lives in localized JSON files, not a CMS. Benefits: version-controlled, fast (no DB queries for the marketing site), TypeScript-validated. Tradeoff: non-technical editors need a PR workflow.

---

## Phase 9: Payment Integration (Stripe)

### Architecture
```
Pricing button → POST /api/checkout → Create Order (DB) → Stripe session → Redirect
                                                                  ↓
                                                    Stripe webhook → Update Order → Grant credits
```

### Checkout API Design
- Single `POST /api/checkout` handles both one-time and subscription payments via `interval` field (`"month"`, `"year"`, `"one-time"`)
- Order record created **before** Stripe session — enables tracking abandoned checkouts
- Stripe metadata includes `order_no`, `user_uuid`, `credits` — webhook reconciles via these fields
- CNY support: switches to `wechat_pay` and `alipay` when currency is `cny`

### Webhook Idempotency
- Check order status before processing — skip if already `paid`
- Use database transactions for `updateOrderStatus` + `increaseCredits`

→ See [references/payment.md](references/payment.md) for full checkout API route, webhook handler, and credits management

---

## Phase 10: AI Integration (Vercel AI SDK)

### Multi-Provider Abstraction
Accept `{ provider, model, prompt }` and route through a switch statement:

| Provider | SDK | Usage |
|----------|-----|-------|
| OpenAI | `@ai-sdk/openai` | Standard GPT models |
| DeepSeek | `@ai-sdk/deepseek` | DeepSeek chat/reasoner |
| OpenRouter | `@openrouter/ai-sdk-provider` | 200+ models via one API |
| SiliconFlow | `@ai-sdk/openai-compatible` | Chinese model providers |

### Reasoning Model Support
For models with reasoning traces (DeepSeek-R1), wrap with middleware:
```ts
const enhancedModel = wrapLanguageModel({
  model: textModel,
  middleware: extractReasoningMiddleware({ tagName: "think" }),
});
```

The AI route is thin: validate params → select provider → call `generateText()` → return `{ text, reasoning }`. Add providers by adding a switch case without changing client code.

---

## Phase 11: Theme System

### Three-Layer Architecture
```
CSS Variables (theme.css)    → HSL color definitions for :root and .dark
Tailwind Config              → Semantic color mappings (primary, muted, card, sidebar...)
Component Classes (shadcn)   → bg-primary, text-muted-foreground, border-border
```

### Theme Storage Priority
1. `NEXT_PUBLIC_DEFAULT_THEME` env var
2. localStorage with TTL (custom cache wrapper)
3. `prefers-color-scheme` media query
4. Real-time listener on media query changes

### Sidebar Theming
```css
:root {
  --sidebar-background: var(--background);
  --sidebar-accent: var(--background);
}
.dark {
  --sidebar-background: var(--background);
  --sidebar-accent: var(--accent);
}
```

---

## Phase 12: Supporting Patterns

### Responsive Portal (Dialog ↔ Drawer)
Sign-in modal renders as shadcn **Dialog on desktop** and vaul **Drawer on mobile**, selected via `useMediaQuery("(min-width: 768px)")`. Same content component shared. Apply to any modal needing mobile optimization.

### Dynamic Icon Resolver
```tsx
<Icon name="RiAddLine" />
```
Resolves a two-character prefix to a `react-icons` package (Ri → react-icons/ri). Icons referenced by string in data objects (sidebar nav, toolbar buttons, landing config) without JSX imports.

### Client Cache (localStorage with TTL)
```ts
// Stores "timestamp:value" format, auto-removes expired entries on read
cacheSet("key", value, ttlMs);
const value = cacheGet("key"); // returns null if expired
```

### Consistent API Envelope
Every API route returns `{ code, message, data }`:
```ts
respData(data)   // → { code: 0, message: "ok", data: [...] }
respErr(msg)     // → { code: -1, message: msg }
respOk()         // → { code: 0, message: "ok" }
```

### Sidebar: Two Implementations

| Sidebar | When | Implementation |
|---------|------|----------------|
| **Console** | ≤5 items, flat nav | Custom `<aside>` column (`lg:w-1/5`), simple nav items with `usePathname` active state |
| **Dashboard** | Groups/sub-items, collapse desired | shadcn `SidebarProvider` + `Sidebar` + `SidebarInset`, collapsible nav groups, brand header, social links |

### Analytics
Analytics components render inside the provider chain, available on every page without per-page setup:
```tsx
// components/analytics/index.tsx
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <OpenPanelAnalytics />
      <GoogleAnalytics />
    </>
  );
}
```
Providers gated by env vars and NODE_ENV — enabled only in production when configured.

---

## Phase 13: Deployment

### Vercel (Primary)
- Default deployment target. App Router works natively.
- `output: "standalone"` in next.config.mjs enables Docker or alternative hosting without config changes.
- Environment variables configured via Vercel dashboard or `.env` files.

### Docker
```dockerfile
FROM node:20-alpine AS base
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
Built-in support since `output: "standalone"` was set from day one in Phase 1.

### Cloudflare Pages (Alternative)
```bash
pnpm add @cloudflare/next-on-pages
pnpm cf:build
wrangler pages deploy
```

### Environment Variables Pattern
- `NEXT_PUBLIC_*` — client-side accessible (auth flags, web URL, analytics IDs, Stripe publishable key)
- Server-only — secrets (API keys, service role keys, Stripe secret, webhook secret)
- All auth providers behind env flags for deploy-time toggling

---

1. **Data drives UI** — slots, blocks, sidebar, landing page all render from typed config objects, not hand-crafted JSX
2. **Layouts are progressive** — each route group adds one layer of concern (i18n → shell → auth → sidebar)
3. **Services over models** — thin HTTP routes delegate to services, which orchestrate models and business logic
4. **Config over code** — env flags toggle features (auth providers, locale detection, default theme)
5. **Two levels of i18n** — UI labels via next-intl messages; content via locale-specific JSON
6. **Provider chain is intentional** — each provider depends on the one above it (auth → context → theme)
7. **Auth at layout level** — gate access in layouts, not per-page
8. **Consistent API envelope** — `{ code, message, data }` everywhere
