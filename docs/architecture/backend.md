# Backend architecture and deployment guide

> Applies to: `apps/api`, `infra/`, `packages/schemas`, `packages/api-client`, `docker-compose.yml`, `.github/workflows`
> Source of truth for scope and rules: [PRD.md](../PRD.md) §5–§9. This guide turns those sections into a build plan. If the two disagree, the PRD wins; fix this file.

---

## 1. Where things stand

| Area | State |
|---|---|
| Frontend (`apps/web`) | P0 complete: every P1/P2 screen runs on MSW mock handlers and Zod schemas |
| Contracts (`packages/schemas`) | Zod schemas for every screen; these become the API contract |
| Backend (`apps/api`) | Folder skeleton only: 19 module folders, `main.ts`, `worker.ts`, `schema.ts` are empty |
| Infra (`infra/`) | CDK stack files exist but are empty |
| Local stack (`docker-compose.yml`) | Empty |

So the backend starts from zero, but the **API is already designed**: every MSW handler in `apps/web/mocks/handlers/` is a working spec of one endpoint (path, guard, input, output, side effects). Build the real endpoint to behave exactly like its mock.

---

## 2. Big picture

```text
                 Data Principal's browser                Staff browser (DPO, admin)
                 (client website + SDK banner)           (Next.js console)
                          │                                       │
                          ▼                                       ▼
              ┌──────────── CloudFront + WAF (cdn., api., app., tenant domains) ────────────┐
              └───────────────────────────────┬─────────────────────────────────────────────┘
                                              ▼
                                   ALB (HTTPS only, private origin)
                      ┌───────────────────────┼────────────────────────┐
                      ▼                       ▼                        ▼
                ECS: web (Next.js)      ECS: api (NestJS HTTP)    ECS: worker (NestJS jobs)
                                              │  same image, two entrypoints  │
                                              ▼                                ▼
                         RDS Proxy → PostgreSQL 16 (Multi-AZ, RLS on every tenant table)
                                              │
              KMS (artefact signing, data keys) · S3 Object Lock (receipts, ledger anchors, exports)
              SES (email) · DLT SMS gateway · SQS control link (internal admin panel, Appendix A)
```

**One codebase, one Docker image, two processes:**
- `api` (`src/main.ts`): HTTP only. Validates, authorises, writes in a transaction, returns. Never calls slow external services inline.
- `worker` (`src/worker.ts`): everything slow or scheduled: webhook delivery, emails/SMS, SLA timers, erasure jobs, nightly ledger anchoring, report generation.

They talk only through Postgres: the API writes an **outbox** row in the same transaction; the worker picks it up.

---

## 3. Inside the API: how one request flows

```text
Request
 → helmet / CORS / request-id middleware
 → TenantContext   resolve tenant from the *authenticated* identity (session, API key, or SDK publishable key + Origin)
 → AuthGuard       who is calling (staff session · server API key · SDK key · principal OTP session)
 → RbacGuard       does the active role hold the route's permission (same matrix as apps/web/lib/permissions.ts)
 → ZodPipe         validate params/query/body with the schema from @consent/schemas
 → Controller      thin: maps HTTP ↔ application service
 → Service         business rules; opens ONE transaction:
                     SET LOCAL app.tenant_id = '<uuid>'       (RLS now filters every query)
                     read / write own tables via Drizzle
                     append ledger entry (consent changes only)
                     insert outbox event(s)
                     COMMIT
 → Response        serialise through the response schema (strips extra fields / PII)
 → Exception filter  fail closed; no stack traces; error = { code, message, requestId }
```

Rules that make this safe (PRD §9):
- Tenant ID **never** comes from body or query. It comes from the session or key.
- Every lookup by ID also filters by tenant (RLS does it, and the service checks too). This prevents IDOR.
- The app DB role has `NOBYPASSRLS`; migrations run as a separate `migrator` role.

### Module layout (each of the 19 modules)

```text
src/modules/consent/
├── index.ts            # the ONLY thing other modules may import (service interface + event types)
├── api/                # controllers, route guards, request/response mapping
├── application/        # services / use cases (transactions live here)
├── domain/             # pure logic: state machine, artefact builder, rules (no I/O, easy to unit test)
└── infrastructure/     # Drizzle tables + repositories, KMS/S3 adapters for this module
```

Shared code lives in `src/shared/` (db client + tenant transaction helper, crypto, storage, queue, logger, guards, outbox).

---

## 4. Data layer

### 4.1 Table conventions

Every tenant table has:

```sql
tenant_id  uuid not null references tenants(id),
id         uuid primary key default gen_random_uuid(),   -- or UUIDv7 from the app
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

and this RLS policy (template in `src/database/rls/`, a protected path):

```sql
alter table <t> enable row level security;
alter table <t> force row level security;
create policy tenant_isolation on <t>
  using (tenant_id = current_setting('app.tenant_id')::uuid)
  with check (tenant_id = current_setting('app.tenant_id')::uuid);
```

Phone and email columns are envelope-encrypted with the tenant's KMS data key and stored with a separate keyed hash for lookup.

### 4.2 The four special tables

| Table | Why it is special |
|---|---|
| `consent_ledger` | Append-only. App role has INSERT and SELECT only, no UPDATE/DELETE. Each row: `seq`, `prev_hash`, `entry_hash = sha256(prev_hash ‖ canonical(payload))`, `artefact_jws`. One chain per tenant; lock the tenant's head row (`ledger_heads … FOR UPDATE`) while appending. |
| `outbox` | `type`, `payload`, `published_at`. Written in the same transaction as the business change; the worker publishes and marks it. Guarantees no lost or phantom events. |
| `pgboss.*` | Job queue (pg-boss) for retries, schedules and delays. No extra infrastructure in P1. |
| `audit_events` | Every admin action, auth event, support-access session. Append-only like the ledger. |

### 4.3 Where each screen's data lives (mock endpoint → module)

| Mock endpoint(s) in `apps/web/mocks/handlers` | Module | Phase |
|---|---|---|
| `/auth/session`, `/auth/staff-login`, `/auth/sign-out`, `/auth/switch-role`, `/users`, `/sso` | identity | P1 (SSO P2) |
| `/tenants`, `/onboarding`, `/branding`, `/sandbox`, `/log-retention` | tenancy | P1 / P2 |
| `/purposes`, `/inventory`, `/legitimate-uses` | catalogue | P1 / P2 |
| `/processors` | processors | P2 |
| `/notices`, `/notices/:id/diff`, `/notices/:id/publish`, `/banner`, `/language-packs`, `/language-packs/:code`, `…/privacy-policy` | notices | P1 / P2 |
| `/principals`, `/principals/:id`, `/withdrawals`, `/withdrawals/:id/retry`, `/channels` | consent (+ principal) | P1 |
| `/guardian-consents`, `/guardian-consents/:id/decision` | principal | P2 |
| `/ledger/verify` | ledger | P1 |
| `/dsr`, `/dsr/:id`, `/dsr/templates`, `/verification-settings`, `/workflow-rules` | dsr | P2 |
| `/grievances`, `/grievances/:id` | grievance | P2 |
| `/breaches`, `/breaches/:id/notify` | breach | P2 |
| `/retention`, `/erasures`, `/erasures/:id/hold` | retention | P2 |
| `/audit-packs`, `/reports`, `/assessments` | compliance | P2 |
| `/api-keys`, `/webhooks`, `/webhooks/deliveries/:id/replay`, `/interop` | integrations | P1 (interop P2) |
| `/notifications`, `/notifications/read-all` | notifications | P2 |
| `/audit-log` | audit | P1 |
| `/overview/*` (metrics, trend, purposes, channels, attention, activity, integrations, setup, extras), `/usage` | analytics | P1 / P2 |
| `/support-access`, `/support-access/:id/decision` | support-access | P2 |

**Not in the mocks yet, needed in P1:** the public consent API the SDK calls, e.g. `GET /v1/public/config` (banner + notice for this site), `POST /v1/public/consents`, `POST /v1/public/consents/:id/withdraw`, `GET /v1/public/preferences`. Authenticated by a publishable key + allowed Origin, rate-limited per key and IP.

---

## 5. Core flows to get right first

### 5.1 Give consent (the critical path, p95 < 200 ms)

```text
SDK → POST /v1/public/consents { purposeIds, noticeVersion, principal identifier, channel }
 1. Resolve tenant from publishable key; check Origin is on the tenant's allowlist
 2. Validate with Zod; idempotency key required
 3. BEGIN; SET LOCAL app.tenant_id
 4. Upsert principal (encrypted contact + lookup hash)
 5. Build artefact (principal, purposes, data elements, notice hash, validity, timestamps)
 6. Sign artefact: KMS Sign (ECC_NIST_P256, ECDSA_SHA_256) → JWS (ES256) via `jose`
 7. Insert consent row (state: granted) + ledger entry (hash-chained) + outbox "consent.granted"
 8. COMMIT → return receipt { consentId, artefact JWS, ledger seq }
Worker: outbox → webhook jobs (HMAC-signed, retry with backoff, dead-letter) → delivery log
```

Withdraw is the same shape with state `withdrawn`, plus one propagation target row per downstream system/processor (drives the Withdrawal propagation screen).

### 5.2 Scheduled jobs (worker)

| Job | Schedule | Module |
|---|---|---|
| Deliver webhooks, retry, dead-letter | on outbox event | integrations |
| DSR / grievance SLA timers → notifications | every 15 min | dsr, grievance, notifications |
| Pre-erasure notice (48 h) then erase + certificate | hourly | retention |
| Consent expiry and renewal prompts | daily | consent |
| Ledger anchor: per-tenant chain head → S3 Object Lock | nightly | ledger |
| Usage metering roll-up | hourly | analytics |

### 5.3 Auth

| Caller | Mechanism |
|---|---|
| Staff (console) | Better Auth: email + password + mandatory MFA for admin/DPO; HttpOnly Secure SameSite=Lax cookie; 30-min idle timeout; `switch-role` changes the active role within the user's granted roles |
| Server-to-server | API key (hashed at rest, scoped, rotatable); shown once on creation |
| SDK in a browser | Publishable key + Origin allowlist (no secret in the browser) |
| Data Principal | OTP (SMS/email) session for preference centre and rights requests |
| Internal admin panel | Signed commands via SQS only (control-agent, protected path) |

---

## 6. Local development

### 6.1 What `docker-compose.yml` should run (to write in step 1)

| Service | Image | Used for |
|---|---|---|
| postgres | `postgres:16` | Main DB; init script creates `migrator` and `app` (NOBYPASSRLS) roles |
| localstack | `localstack/localstack` | KMS (sign), S3 (Object Lock buckets), SQS (control link), SES |
| mailpit | `axllent/mailpit` | Catch outgoing email; web UI to read it |
| fake-command-sender | small script | Sends signed test commands to the control-agent |

### 6.2 Daily loop

```bash
docker compose up -d                 # Postgres, LocalStack, Mailpit
pnpm --filter api db:migrate         # drizzle-kit migrate as migrator role
pnpm --filter api db:seed            # same synthetic tenants as the mocks (Globals Inc, Consento Pvt Ltd, Hello LLP)
pnpm --filter api dev                # api on :4000
pnpm --filter api dev:worker         # worker
NEXT_PUBLIC_API_MODE=live NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1 pnpm --filter web dev
```

Keep the mock mode working: `NEXT_PUBLIC_API_MODE=mock` stays the default for UI work and demos.

### 6.3 Environment variables (`apps/api/.env.example`, never real values)

`DATABASE_URL` (app role) · `DATABASE_MIGRATOR_URL` · `AWS_REGION=ap-south-1` · `AWS_ENDPOINT_URL` (LocalStack locally, unset in AWS) · `KMS_SIGNING_KEY_ID` · `S3_ANCHOR_BUCKET` · `S3_EXPORT_BUCKET` · `SES_FROM` · `SMS_PROVIDER` · `AUTH_SECRET` · `APP_ORIGIN` · `LOG_LEVEL`. In AWS these come from Secrets Manager and task definitions, not files.

---

## 7. Build order (P1: 18 Jan – 15 Mar 2027)

Each step ends with the listed screens working in `live` mode.

| Step | Weeks | Build | Done when |
|---|---|---|---|
| 0. Contract | before P1 | Generate OpenAPI 3.1 v0 from `@consent/schemas` (nestjs-zod / zod-openapi); generate `packages/api-client` | Frontend team agrees the spec; mocks and spec match |
| 1. Skeleton | 1 | NestJS app + worker, config, pino logger with PII redaction, global exception filter, health check, Dockerfile (ARM64, distroless), docker-compose | `GET /health` works locally and in CI |
| 2. Data + tenancy | 1–2 | Drizzle setup, `tenants` table, RLS template, tenant-transaction helper, migrations, seed | **Isolation test**: tenant A can never read tenant B (Testcontainers), runs in CI |
| 3. Identity | 2 | Better Auth, MFA, roles matrix, `switch-role`, guards, audit events | Console login + role switch work live; `/users` live |
| 4. Catalogue + notices | 3 | purposes, data elements, notices with versions + hash, banner config | Purposes, Notices, Banner screens live |
| 5. Consent engine | 3–5 | Artefact, state machine, KMS signing, ledger, outbox, public SDK API, idempotency, rate limits | SDK demo grants/withdraws for real; ledger verifies; p95 < 200 ms at 200 RPS (k6) |
| 6. Integrations | 6 | API keys, webhooks (HMAC, SSRF-safe URL check, retries, replay), delivery log | Webhooks screen live; replay works |
| 7. Console wiring | 7 | Consent lookup, withdrawals, overview metrics, audit log, ledger verify | Overview, Consent lookup, Withdrawal propagation, Audit log, Reports (ledger panel) live |
| 8. Control-agent + pilot | 8 | Signed command consumer, telemetry; staging → prod; internal VAPT | 2 pilot tenants live (PRD P1 exit) |

P2 (16 Mar – 30 Apr) then follows PRD §4.2 steps 4–5 module by module: dsr → grievance → breach → retention → principal (guardian) → compliance → processors → notifications → tenancy extras → identity SSO/SCIM → integrations interop. Cut order if late: Consent Manager API, sandbox, SSO/SCIM, DPIA.

**Per endpoint, every time** (PRD §9.2 rule 7): guard · Zod input schema · tenant-scoped query · authorisation test · IDOR test. Then flip that screen's hooks to live and delete nothing from the mocks.

---

## 8. Deployment

### 8.1 AWS accounts (set up once, before step 1 deploys)

| Order | Do | Notes |
|---|---|---|
| 1 | Create AWS Organization + Control Tower in the **management** account | Control Tower creates **log-archive** and **audit/security** accounts for you |
| 2 | Add **shared** (ECR, CI roles), **staging**, **prod** accounts | **ops** (internal admin panel) can wait until the control link is built |
| 3 | SCPs: region lock to ap-south-1 / ap-south-2; deny disabling CloudTrail, GuardDuty, Config; deny IAM users | Data residency is enforced here, not by convention |
| 4 | IAM Identity Center with MFA for people; root with hardware MFA, then locked away | No long-lived access keys anywhere |
| 5 | GitHub OIDC provider + deploy role per account, trusted only for this repo and `main` / environments | CI deploys; humans don't |

### 8.2 CDK stacks (`infra/lib/`, deploy in this order)

| Stack | Contains |
|---|---|
| `network-stack` | VPC across 3 AZs: public (ALB, NAT), private (ECS), isolated (RDS) subnets; VPC endpoints (S3, ECR, KMS, Secrets Manager, CloudWatch, SES); Flow Logs |
| `security-stack` | KMS keys (CMK for data, asymmetric P-256 signing key), Secrets Manager entries, IAM task roles (least privilege), GuardDuty/Inspector hooks |
| `data-stack` | RDS PostgreSQL 16 Multi-AZ + RDS Proxy, parameter group (force SSL), 35-day PITR, S3 buckets (exports, receipts, ledger anchors with Object Lock compliance mode), AWS Backup with cross-region copy |
| `app-stack` | ECR repos, ECS cluster (Fargate, Graviton), services `api` (min 2), `worker` (min 1), `web` (min 2), ALB with HTTPS only, autoscaling, circuit-breaker rollback, migration task definition |
| `edge-stack` | Route 53, ACM certificates, CloudFront (`app.`, `api.`, `cdn.`), WAF managed rules + rate rules, tenant custom domains later |
| `observability-stack` | Log groups (1-year retention), alarms → SNS → Slack/email, Synthetics canaries, dashboards |
| `control-link-stack` | SQS + DLQ for signed commands, telemetry publishing (Appendix A) |

`infra/config/staging.ts` vs `prod.ts` hold sizes: staging is single-AZ and scaled down (≈ USD 150–200/month); prod as PRD §7.7 (≈ USD 490–710/month). `cdk-nag` runs on every synth.

### 8.3 Release pipeline (`.github/workflows`, protected path)

```text
Pull request  → typecheck · lint · unit · RLS isolation (Testcontainers) · Semgrep · gitleaks · dependency audit
Merge to main → build ARM64 image · Trivy · SBOM · push to ECR (immutable tag = git SHA)
              → cdk diff + deploy to STAGING
              → run migrations as one-off ECS task (expand/contract only, never destructive in one step)
              → Playwright E2E (live mode) · k6 smoke · ZAP baseline
              → manual approval (required reviewer)
              → deploy PROD (rolling + circuit breaker) → canaries → auto-rollback on alarm
```

### 8.4 Where the frontend goes

- **P0 demo:** static export of `apps/web` (mock mode) to S3 + CloudFront in staging, behind basic access control.
- **P1+:** `web` runs on ECS behind the same CloudFront as `api`, in `live` mode, so cookies stay first-party and the CSP lists only real origins.

---

## 9. Quality gates you will hit

| Gate | Tool | Blocks merge when |
|---|---|---|
| Tenant isolation | Vitest + Testcontainers (`test/isolation/`) | Any cross-tenant read or write succeeds |
| Authorisation + IDOR | E2E per route (`test/e2e/`) | A role or another tenant can reach a resource it shouldn't |
| Ledger integrity | Unit + verification CLI | Chain breaks or a consent change lacks a ledger row in the same transaction |
| Performance | k6 (`test/load/`) | Consent write p95 ≥ 200 ms at 200 RPS (from P1 week 5) |
| Security | Semgrep, gitleaks, Trivy, dependency audit, ZAP | Any high or critical finding |

---

## 10. Decide before you start

| Decision | Options | Recommendation |
|---|---|---|
| Who owns the AWS Organization and billing | Globals ITES central IT vs this product team | Central IT owns management account; this team gets staging/prod |
| Domains | e.g. `app.<product>.in`, `api.…`, `cdn.…` | Pick the product domain now; ACM and SES verification take days |
| SMS provider (DLT registration) | MSG91, Gupshup | Start DLT template registration early; it takes 1–2 weeks |
| OpenAPI-first or code-first | Generate spec from Zod (code-first) vs hand-written spec | Code-first from `@consent/schemas`: one source of truth, already written |
| Staff auth | Better Auth now, Zitadel/Keycloak at SSO time | Better Auth for P1 as PRD §6; revisit in P2 with SSO |

---

## 11. Your first ten working days

1. Write `docker-compose.yml` (Postgres, LocalStack, Mailpit) and `.env.example`.
2. Bootstrap NestJS in `apps/api`: `main.ts`, `worker.ts`, config module, pino with redaction, exception filter, `/health`.
3. Drizzle config + first migration: `tenants`, `users`, `audit_events`, `outbox`; RLS template; `app` / `migrator` roles.
4. Tenant-transaction helper (`withTenant(tenantId, fn)` sets `app.tenant_id` inside the transaction).
5. Isolation test that fails if RLS is missing on any tenant table (query `pg_class.relrowsecurity` for every table with `tenant_id`).
6. Seed script with the three demo tenants and staff users from the mocks.
7. Generate OpenAPI v0 from `@consent/schemas`; generate `packages/api-client`.
8. Better Auth login + session endpoint matching `GET /auth/session`; flip the login screen to live.
9. CI workflow for PRs (typecheck, lint, tests, isolation, Semgrep, gitleaks).
10. In parallel (needs AWS access): Organization, Control Tower, staging account, GitHub OIDC role, `network-stack` + `data-stack` deployed to staging.

Write an ADR in `docs/adr/` for any choice that differs from the PRD, and add a runbook in `docs/runbooks/` for each operational task the first time you do it (migrations, key rotation, restore drill).
