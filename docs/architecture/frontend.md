# Frontend Architecture — Consent Management Platform

> Path: `docs/architecture/frontend.md`
> Applies to: `apps/web`, `apps/sdk-demo`, `packages/ui`, `packages/schemas`, `packages/i18n`, `packages/sdk-web`
> Phase: P0 (frontend prototype on mocks) → P1/P2 (wired to real API)
> Read with: `AGENTS.md`, `docs/PRD.md`, `docs/architecture/domain-model.md`, `docs/screens/*.md`

---

## 1. Purpose

The frontend is built **first** (P0) to validate every workflow and feature on mock data before backend work starts.
It is production code, not a throwaway prototype: in P1/P2 the mock layer is switched off and the same screens call the real API.

Rules that make this work:

1. Every screen reads and writes data **only** through the typed API client — never directly through mock data.
2. Every request and response shape comes from **Zod schemas in `packages/schemas`** — the same schemas the backend will implement.
3. Mocks (MSW) sit at the network layer, so switching to the real API changes **no component code**.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript `strict` |
| Styling | Tailwind CSS + design tokens (`packages/ui/tokens`) |
| Components | shadcn/ui (copied into `packages/ui`), Radix primitives, lucide-react icons |
| Server state | TanStack Query |
| Tables | TanStack Table |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| Validation / types | Zod (`packages/schemas`) |
| Charts | Recharts |
| i18n | i18next + react-i18next (`packages/i18n`) |
| Mock API | MSW (Mock Service Worker) + `@mswjs/data` in-memory DB |
| Synthetic data | `@faker-js/faker` (seeded, deterministic) |
| Component catalogue | Storybook |
| Unit / component tests | Vitest + Testing Library |
| E2E | Playwright (runs against mock mode in P0) |
| Accessibility | axe-core (Storybook addon + Playwright) |
| Lint / format | ESLint (incl. boundaries, security, jsx-a11y), Prettier |

Pin exact versions in `package.json`. Do not add dependencies outside this list without an ADR (see `AGENTS.md`).

---

## 3. Folder structure

```text
apps/web/
├── app/
│   ├── layout.tsx                    # root: providers, fonts, theme, i18n
│   ├── providers.tsx                 # QueryClient, i18n, MSW bootstrap (mock mode)
│   ├── (auth)/
│   │   └── login/                    # tenant staff login (mock in P0)
│   ├── (dpo)/                        # DPO console
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── principals/               # consent lookup + ledger trail
│   │   ├── dsr/                      # queue + detail
│   │   ├── grievances/
│   │   ├── breaches/                 # register + notification wizard
│   │   └── audit/                    # evidence pack export
│   ├── (admin)/                      # tenant configuration
│   │   ├── layout.tsx
│   │   ├── onboarding/
│   │   ├── purposes/
│   │   ├── notices/
│   │   ├── banner/                   # designer + live preview
│   │   ├── retention/
│   │   ├── users/
│   │   ├── api-keys/
│   │   ├── webhooks/
│   │   ├── support-access/
│   │   └── audit-log/
│   ├── not-found.tsx
│   └── error.tsx
├── features/                         # feature logic, one folder per domain
│   ├── consent/
│   │   ├── api.ts                    # query/mutation hooks (uses api-client)
│   │   ├── keys.ts                   # query keys
│   │   ├── components/               # feature-specific components
│   │   └── index.ts                  # public exports only
│   ├── notices/
│   ├── purposes/
│   ├── dsr/
│   ├── grievance/
│   ├── breach/
│   ├── retention/
│   ├── users/
│   ├── integrations/                 # api keys + webhooks
│   ├── support-access/
│   ├── audit/
│   └── analytics/
├── lib/
│   ├── api-client.ts                 # fetch wrapper: base URL, errors, tenant header, schema parse
│   ├── auth/                         # session hook, role guard components
│   ├── tenant/                       # tenant resolution + context
│   ├── rbac.ts                       # role → permission map
│   └── format.ts                     # dates (IST), numbers, IDs
├── mocks/
│   ├── browser.ts                    # MSW worker setup
│   ├── db.ts                         # @mswjs/data models
│   ├── seed/                         # deterministic synthetic data
│   ├── handlers/                     # one file per domain (consent.ts, dsr.ts …)
│   └── scenarios.ts                  # empty | normal | heavy | error | slow
├── middleware.ts                     # tenant resolution, route-group auth redirect
├── tests/e2e/                        # Playwright specs per workflow
├── .storybook/
└── next.config.ts                    # security headers, CSP

apps/sdk-demo/                        # static sample client website using packages/sdk-web

packages/
├── schemas/                          # Zod: entities, requests, responses, enums
├── ui/                               # shadcn components, tokens, layout shells
├── i18n/                             # English console string catalogue (locales/en.ts)
└── sdk-web/                          # consent SDK + Preact banner
```

### Import rules (enforced by ESLint boundaries)

| From | May import | Must not import |
|---|---|---|
| `app/**` | `features/*` (via `index.ts`), `lib/*`, `packages/ui`, `packages/i18n` | `mocks/*`, another feature's internals |
| `features/<a>` | `lib/*`, `packages/*`, `features/<b>/index.ts` | `features/<b>/components/*` internals, `mocks/*` |
| `mocks/**` | `packages/schemas` | `app/**`, `features/**` |
| Anything | `packages/schemas` | `apps/api/**` |

---

## 4. Surfaces and route map

### 4.1 DPO console — `(dpo)`

| Route | Screen | Feature IDs |
|---|---|---|
| `/dashboard` | Consent overview metrics, SLA status, notice version coverage | DPO-01 |
| `/principals`, `/principals/[id]` | Consent lookup + ledger trail | DPO-02 |
| `/withdrawals` | Withdrawal propagation tracker | DPO-11 |
| `/dsr`, `/dsr/[id]` | Rights request inbox, SLA timers, response templates, tasks | DPO-03, DPO-04 |
| `/guardian-consents` | Children and guardian consent queue | DPO-12, COL-08 |
| `/grievances-queue` | Grievance queue with closure evidence | DPO-05 |
| `/breaches`, `/breaches/new`, `/breaches/[id]` | Breach register, notification wizard, incident timeline | DPO-06 |
| `/erasure` | Erasure scheduler, pre-erasure notices, certificates | DPO-13 |
| `/legitimate-uses` | Legitimate-use register | CFG-08, DPO-14 |
| `/audit` | Evidence pack export | DPO-07 |
| `/reports` | Reports export + ledger verification | DPO-15, ENG-08 |
| `/dpia` | DPIA and annual audit | DPO-09 |
| `/notifications` | Notifications centre (footer bell; no sidebar entry) | PLT-01 |
| `/settings` | Settings hub (footer gear; no sidebar entry): account details + set-once admin pages in six groups — see §4.4 | CFG, PLT |

Responsive from 360 px to wide desktop (see §9.1); optimised for desktop, dense tables, keyboard navigation.

### 4.2 Tenant configuration — `(admin)`

| Route | Screen | Feature IDs |
|---|---|---|
| `/onboarding` | Setup wizard (no sidebar entry; "Complete setup" card on `/dashboard` until every step is done) | — |
| `/purposes` | Purpose catalogue + data elements | CFG-01 |
| `/data-inventory` | Purpose → data categories, systems, retention | CFG-17 |
| `/processors` | Processors, DPAs, instructions | CFG-16 |
| `/notices`, `/notices/[id]` | Notice builder, versions, diff, re-consent campaign | CFG-02, COL-09 |
| `/languages` | Language packs: banner, notice and privacy policy per language, with approval; privacy policy editable | CFG-11, COL-05 |
| `/banner` | Banner designer + live preview | CFG-03 |
| `/channels` | Collection channels incl. assisted consent | CFG-18 |
| `/retention` | Retention rules + pre-erasure templates | CFG-09 |
| `/verification` | Identity verification strength per request type | CFG-19 |
| `/workflows` | SLA, approvers, auto-assign, escalation | CFG-20 |
| `/branding` | Logo, colours, domain, email sender | CFG-21, CFG-12 |
| `/users` | Users, roles, MFA | CFG-04, CFG-07 |
| `/sso` | SAML / OIDC SSO and SCIM | CFG-13 |
| `/api-keys` | API keys | CFG-05 |
| `/webhooks` | Endpoints, delivery log, replay | CFG-06, INT-02 |
| `/interop` | Consent Manager API layer | INT-06 |
| `/log-retention` | Log retention policy | CFG-22 |
| `/support-access` | Approve / deny Globals JIT requests | CFG-14 |
| `/audit-log` | Admin action log | CFG-15 |
| `/sandbox` | Sandbox tenant | PLT-02 |
| `/usage` | Usage metering | PLT-03 |

### 4.4 Navigation: sidebar vs Settings

Single source: `lib/nav.ts` (`navSections`, `settingsGroups`, `standaloneRoutes`). Rule of thumb: **daily work and core consent setup in the sidebar; set-once admin pages under the gear.** Keep the sidebar at ~20 items.

| Sidebar section | Items |
|---|---|
| Privacy operations | Overview, Consent lookup, Withdrawal propagation, Rights requests, Guardian consents, Grievances, Breaches, Erasure scheduler, Legitimate uses |
| Compliance and reporting | Audit pack, Reports, DPIA and audits, Audit log |
| Configuration | Purposes, Data inventory, Processors, Notices, Banner, Collection channels, Retention |

| Settings group (`/settings`) | Items |
|---|---|
| Organisation | Branding, Language packs |
| Access and identity | Users and roles, SSO and SCIM, Support access |
| Developer and integrations | API keys, Webhooks, Consent Manager API, Sandbox |
| Data and logs | Log retention |
| Workflows | SLA and workflows, Identity verification |
| Account | Usage |

No menu entry (still role-gated via `standaloneRoutes`): `/onboarding` (Overview setup card), `/notifications` (footer bell), `/settings` (footer gear). Header search covers all three lists.

### 4.3 SDK demo — `apps/sdk-demo`

Static sample client site (e.g. a mock e-commerce page) loading `packages/sdk-web`: banner, preference centre, withdraw link. Points at the MSW-backed `apps/web` mock API in P0.

---

## 5. Tenant resolution

| Phase | Behaviour |
|---|---|
| P0 | Tenant chosen from a **tenant switcher** in the header (3 seeded tenants). Stored in a non-sensitive cookie `x-tenant-slug`. |
| P1+ | `middleware.ts` resolves the tenant from host: `<slug>.app.<domain>` or a verified custom domain. Unknown host → 404. |

- The tenant ID is **never** taken from page params or form inputs for authorisation; the backend derives it from the session. The frontend sends it only as a routing hint.
- All query keys include the tenant slug so cache never leaks across tenants: `['tenant', slug, 'consents', filters]`.

---

## 6. Authentication and roles

### 6.1 P0 (mock)

- `/login` signs in with mock staff accounts (Tenant admin, DPO, Operator, Viewer).
- Mock session lives in MSW memory and a non-HttpOnly dev cookie — **mock mode only**, removed by build flag in P1.

### 6.2 P1+ (real)

- Better Auth session in **HttpOnly, Secure, SameSite=Lax** cookies. No tokens in `localStorage` or `sessionStorage`.
- MFA enforced for admin and DPO roles.
- Server components check the session; route-group layouts redirect unauthenticated users.

### 6.3 RBAC matrix (UI visibility; backend is the real enforcement)

| Permission | Admin | DPO | Operator | Viewer |
|---|---|---|---|---|
| Configure purposes, notices, banner | ✅ | — | — | — |
| Manage users, API keys, webhooks | ✅ | — | — | — |
| Approve support access | ✅ | ✅ | — | — |
| View consent dashboard | ✅ | ✅ | ✅ | ✅ |
| Look up a principal's consents | ✅ | ✅ | ✅ | — |
| Work DSR / grievance queues | ✅ | ✅ | ✅ | — |
| Manage breaches | ✅ | ✅ | — | — |
| Export audit pack, reports | ✅ | ✅ | — | — |
| Compliance views (erasure, legitimate uses, DPIA) — `compliance.view` | ✅ | ✅ | — | — |
| Withdrawal propagation (with consent lookup) | ✅ | ✅ | ✅ | — |
| Guardian consent queue (with DSR queue) | ✅ | ✅ | ✅ | — |
| Notifications centre | ✅ | ✅ | ✅ | ✅ |
| Sandbox, usage, SSO, Consent Manager API (admin config) | ✅ | — | — | — |

Sidebar sections: Privacy operations · Compliance and reporting · Configuration; set-once pages under Settings (§4.4, `lib/nav.ts`).

Admin sees every page (avoids friction and blind spots); every action is attributed to the acting user in the audit log. The header **DPO** button (accounts holding admin + dpo) switches the active role to `dpo` (`POST /auth/switch-role`) to narrow the console to DPO work only; **Exit DPO** switches back.

Use `<Can permission="dsr.assign">` and `usePermission()` from `lib/rbac.ts`. Hiding a button is **not** security — the backend rechecks every action.

---

## 7. Data layer

### 7.1 API client (`lib/api-client.ts`)

- One `request(schema, path, options)` function: adds base URL, credentials, tenant hint, idempotency key on mutations.
- **Parses every response with its Zod schema**. Schema mismatch → typed error + Sentry event (no PII).
- Normalised error type: `{ code, message, fieldErrors?, requestId }`.
- No `fetch` calls anywhere else in the app.

### 7.2 Hooks per feature (`features/<x>/api.ts`)

```ts
export const consentKeys = {
  all: (t: string) => ['tenant', t, 'consents'] as const,
  list: (t: string, f: ConsentFilters) => [...consentKeys.all(t), 'list', f] as const,
  detail: (t: string, id: string) => [...consentKeys.all(t), 'detail', id] as const,
};

export function useConsents(filters: ConsentFilters) { /* useQuery + api-client */ }
export function useWithdrawConsent() { /* useMutation + invalidate consentKeys.all */ }
```

- Mutations invalidate the narrowest affected keys.
- Optimistic updates only for low-risk toggles in config screens; **never** for consent grant/withdraw (show confirmed server state only).

### 7.3 Mode switch

```
NEXT_PUBLIC_API_MODE=mock   # P0 default: MSW intercepts, no backend
NEXT_PUBLIC_API_MODE=live   # P1+: real API at NEXT_PUBLIC_API_BASE_URL
```

MSW is started in `providers.tsx` **only** when mode is `mock`. Production builds fail if `API_MODE=mock`.

---

## 8. Mock strategy (P0)

| Element | Rule |
|---|---|
| Handlers | `mocks/handlers/<domain>.ts`, one per backend module; same paths and methods as the planned OpenAPI |
| Shapes | Every handler response built from and validated by the `packages/schemas` Zod schema |
| Data | `@mswjs/data` in-memory DB seeded by `mocks/seed/` with a fixed faker seed — deterministic across reloads |
| Synthetic only | No real names, phones, emails or client data. Use faker + clearly fake domains (`example.in`) |
| State changes | Handlers apply realistic transitions: consent `granted → withdrawn`, DSR `submitted → in_progress → completed`, SLA timers from timestamps |
| Scenarios | `?scenario=empty|normal|heavy|error|slow` (or Storybook toggle) to exercise every UI state |
| Latency | 150–600 ms random delay by default to surface loading states |
| Contract output | Handlers + schemas are the source for OpenAPI v0 (`pnpm contract:gen`) handed to backend in P1 |

Seeded data minimum: 3 tenants, 12 purposes, 4 notice versions, 500 principals, 5,000 consent events, 40 DSRs across all statuses, 15 grievances, 3 breaches, 6 webhooks with delivery logs.

Current P0 mock layout (contract source for OpenAPI v0):

| File | Holds |
|---|---|
| `packages/schemas/src/workspace.ts` | Contracts for the original P0 screens (lookup, DSR, grievance, breach, audit pack, config) |
| `packages/schemas/src/programme.ts` | Contracts for the extended screens (DPO-11…15, CFG-16…22, ENG-08, INT-06, PLT-01…03) |
| `mocks/seed/operations.ts`, `screens.ts`, `programme.ts` | Deterministic synthetic rows; derived from one another so Overview counts match every screen |
| `mocks/handlers/screens.ts`, `programme.ts` | Guarded, tenant-scoped handlers; mutations log to the tenant audit log |
| `features/workspace/` | Query / mutation hooks and shared `PageHeader`, `QueryView`, `DataTable`, `Status`, `Due` components |

Known deviation: handlers are grouped per screen family rather than one file per backend module; split them per module before `pnpm contract:gen`.

---

## 9. UI system

- All components come from `packages/ui`. Feature components compose them; they do not restyle primitives.
- Tokens only (`bg-surface`, `text-muted`, spacing scale) — no raw hex values in feature code.
- Light and dark themes via CSS variables.
- Layout shells: `ConsoleShell` (sidebar + header + tenant/role switchers).
- **Every data view implements four states**: loading (skeleton), empty (explanation + primary action), error (message + retry + requestId), success.
- Tables: TanStack Table with server-style pagination, sort, filter, column visibility, row selection where bulk actions exist.
- Destructive or legally significant actions (withdraw consent, close DSR, notify breach, delete) use a confirmation dialog stating the consequence.
- Status values use a shared `<StatusBadge status=…>` driven by schema enums.
- **RAG colours** follow DESIGN.md → *State colours*: `success`/`warning`/`danger` tokens for text, badges and borders; `chart-positive`/`chart-caution`/`chart-negative`/`chart-neutral` for chart series, `<Progress tone>` bars and meters; `<Stat tone>` for state tiles; `limitTone(pct)` for quota meters. Never raw `green-*`/`amber-*`/`red-*` classes in feature code.

### 9.1 Responsive layout (screen sizes)

Every screen must work from **360 px** (phone) to wide desktop with no horizontal page scroll. Tailwind default breakpoints, mobile-first classes:

| Width | Sidebar | Header | Content |
|---|---|---|---|
| < 640 px (base) | Off-canvas drawer (menu button, overlay, Esc / route change closes) | Menu button + organisation + DPO on row 1; search full width on row 2; client logo hidden | `p-4`; grids stack to 1 column; stat rows and `<dl>` pairs stack |
| `sm` ≥ 640 px | Drawer | One row: menu + client logo (120 × 32) · search (flexible) · organisation + DPO | 2-column `<dl>`, 3-column stat rows |
| `md` ≥ 768 px | Drawer | As `sm` | Page grids open up (`md:grid-cols-*`) |
| `lg` ≥ 1024 px | Fixed 240 px sidebar (sticky, own scroll) | 3 columns `1fr · minmax(0,600px) · 1fr`: logo (150 × 40) · search centred · organisation + DPO | `p-5` |
| `xl` ≥ 1280 px | As `lg` | As `lg` | Side panels beside tables (`xl:grid-cols-*`) |

Rules:
- **Mobile-first**: write the phone layout as the base class and widen with `sm:` / `md:` / `lg:` / `xl:`. Never a bare `grid-cols-2+` on content that holds text.
- **Tables** always sit in `DataTable` (`overflow-x-auto`) so wide tables scroll inside their card, not the page. Flex/grid children that hold tables get `min-w-0`.
- **No fixed widths over 360 px** in content. Use `w-full max-w-*`, `minmax(0,…)` or `clamp()`.
- **Spacing-scale trap**: `--spacing-1…8` are the φ tokens (4 6 10 16 26 42 68 110 px), so `size-8`, `w-8`, `p-7`, etc. are **not** Tailwind defaults (`size-8` = 110 px). For icon and control dimensions use explicit pixels (`size-[32px]`, `size-[20px]`); use steps 1–6 only for padding/gaps.
- Overlays (drawer z-40, scrim z-30, sticky header z-20, popovers z-20) must not cover the focused element; drawers close on Esc and navigation.
- Check every new screen at 360, 768, 1024 and 1440 px before marking it done.

---

## 10. Forms

- react-hook-form + zodResolver using the **same schema** as the API request.
- Inline field errors, summary at top for long forms, focus first invalid field on submit.
- Disable submit while pending; mutations carry an idempotency key.
- Multi-step wizards (onboarding, breach notification, DSR) keep step state in the URL (`?step=2`) so refresh does not lose position.

---

## 11. Internationalisation

- **Console UI is English only.** No language switcher; `packages/i18n` holds a single `en` string catalogue so copy stays out of components. Keys: `area.screen.element` (e.g. `overview.kpi.activeConsents`). No hard-coded user-facing strings.
- **Translation applies only to principal-facing content**: banner copy, notice text and the privacy policy. These are tenant data in language packs (CFG-11, `/languages`), fetched from `GET /language-packs/:code` (`LanguageContent` schema), not i18n keys.
- The privacy policy is stored and edited per language (`PUT /language-packs/:code/privacy-policy`); a saved edit returns to `in_review`.
- Notices and banner screens preview content in any pack language via `LanguagePicker`; rendered content carries `lang` and `dir` (Urdu is `rtl`).
- Language list: English + all 22 Eighth Schedule languages (as, bn, brx, doi, gu, hi, kn, ks, kok, mai, ml, mni, mr, ne, or, pa, sa, sat, sd, ta, te, ur); Kashmiri, Sindhi and Urdu are `rtl`. Seeded content: `en`, `hi`, `kn`; the rest are `missing`. The banner preview lists every language and falls back to English (with a warning) where banner text is not added; notices list only languages with content.
- Noto Sans + Noto Sans Devanagari / Kannada etc. loaded for content previews.
- Dates in IST, `DD MMM YYYY, HH:mm`; numbers in Indian grouping (`1,00,000`).

---

## 12. Accessibility (WCAG 2.1 AA)

- Semantic HTML first; Radix primitives for dialogs, menus, tabs.
- Every interactive element reachable and operable by keyboard; visible focus ring.
- Colour contrast ≥ 4.5:1 for text; status never conveyed by colour alone.
- Form inputs have labels; errors linked via `aria-describedby`.
- Banner: focus trapped while open, "Reject all" as prominent as "Accept all", closable with keyboard.
- axe checks must pass in Storybook and Playwright.

---

## 13. Frontend security rules (OWASP-aligned)

| Rule | Detail |
|---|---|
| No raw HTML | No `dangerouslySetInnerHTML`. Notice rich text rendered from a safe AST (e.g. markdown → React) or sanitised with DOMPurify. |
| No secrets in client | Only `NEXT_PUBLIC_*` non-secret config. API keys are shown once on creation, never stored client-side. |
| Session storage | HttpOnly cookies only (P1+). Nothing sensitive in `localStorage`, `sessionStorage`, URL or query string. |
| No PII leakage | No PII in console logs, Sentry events, analytics, URLs or page titles. Mask phone / email in tables (`98******21`). |
| Security headers | Set in `next.config.ts`: CSP (nonce-based, no `unsafe-eval`), HSTS, X-Content-Type-Options, Referrer-Policy `strict-origin-when-cross-origin`, frame-ancestors `none` (except banner preview iframe on same origin). |
| Links | User-provided URLs (webhooks, privacy policy links) validated as `https:`; external links `rel="noopener noreferrer"`. |
| Files | Downloads (receipts, audit packs) only via signed URLs from the API; never construct object URLs from user input. |
| Client checks are UX | Permission checks in UI never replace backend authorisation. |
| Dependencies | No new package without justification; verify it exists and is maintained (anti typo-squat / hallucinated package). |
| Mock code | `mocks/**` excluded from production bundles; CI fails if MSW appears in a production build. |

---

## 14. Performance budgets

| Item | Budget |
|---|---|
| Console route change | ≤ 300 ms with cached data |
| Table of 1,000 rows | Virtualised; no jank |
| `sdk-web` bundle | ≤ 30 KB gzip; banner render ≤ 300 ms on 3G |

Use server components for static shells, dynamic import for charts and the banner designer, and `next/font` for fonts.

---

## 15. Testing

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | Formatters, rbac, hooks with mocked client |
| Component | Vitest + Testing Library | Forms, tables, state rendering (4 states) |
| Visual / catalogue | Storybook | Every component and screen state; a11y addon |
| E2E | Playwright (mock mode) | One spec per workflow below |
| Accessibility | axe in Playwright | Every page |

Required P0 E2E workflows:

1. DPO looks up a Data Principal's consents and ledger trail → exports audit evidence pack.
2. DPO opens a DSR in the queue → assigns → completes fulfilment tasks.
3. DPO opens a grievance in the queue → escalates → resolves within the 90-day cap.
4. DPO logs breach → completes notification wizard → register shows notified status.
5. Admin creates purpose → publishes new notice version → banner preview reflects it → SDK demo shows re-prompt.
6. Admin creates API key (shown once) and webhook → views delivery log → replays a failed delivery.
7. Admin approves a support-access request → it appears in audit log.

---

## 16. Definition of done (per screen)

- [ ] Route, layout and navigation entry added
- [ ] Data only via `features/<x>/api.ts` hooks; schemas from `packages/schemas`
- [ ] MSW handler + seed data for all states
- [ ] Loading, empty, error and success states implemented
- [ ] All console strings in the `en` catalogue (no hard-coded copy)
- [ ] RBAC visibility applied
- [ ] Responsive: checked at 360 / 768 / 1024 / 1440 px, no page-level horizontal scroll (§9.1)
- [ ] Keyboard + screen reader checked; axe passes
- [ ] Storybook story for each state
- [ ] Playwright step covered if part of a workflow
- [ ] Feature ID(s) referenced in PR description
- [ ] PR security checklist (`.github/pull_request_template.md`) complete

---

## 17. P0 → P1 switch-over checklist

- [ ] OpenAPI v0 generated from schemas and agreed with backend
- [ ] `NEXT_PUBLIC_API_MODE=live` builds pass with mocks excluded
- [ ] Mock login and role picker removed; Better Auth wired
- [ ] Tenant resolution moved from switcher to host-based middleware
- [ ] Real error codes mapped in `api-client.ts`
- [ ] E2E suite runs against staging API (same specs, live mode)
- [ ] CSP tightened to real API and CDN origins

---

## 18. Commands

```bash
pnpm install
pnpm --filter web dev            # http://localhost:3000 (mock mode)
pnpm --filter sdk-demo dev       # http://localhost:3001
pnpm --filter web storybook      # http://localhost:6006
pnpm --filter web test           # Vitest
pnpm --filter web e2e            # Playwright (mock mode)
pnpm lint && pnpm typecheck
pnpm contract:gen                # Zod → OpenAPI v0 (docs/api/openapi.yaml)
```
