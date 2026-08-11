# Pegasus CRM — Claude Implementation Plan

## How to use this document

This is the implementation brief for turning the existing Pegasus dealership CRM prototype into a secure paid-pilot MVP.

Claude should execute **one phase at a time**, keep each phase reviewable, and stop at every phase gate. Do not attempt a full rewrite or complete multiple phases in one change set.

## Product goal

Ship a paid-pilot MVP for 2–3 independent, single-rooftop dealerships.

A dealership must be able to:

1. Sign in as an owner, manager, or salesperson.
2. Receive a customer call or text on its Twilio number.
3. Have an AI concierge answer, qualify the customer, and preserve the conversation.
4. Create or update the customer record and book a confirmed appointment in the CRM.
5. Import and manage customers and vehicle inventory.
6. Assign leads, schedule appointments, and track deal status.
7. Send messages only to customers with recorded consent.
8. See real operational metrics rather than sample dashboard data.
9. Export its data and remain completely isolated from every other dealership.

The first dealerships will be onboarded and invoiced manually. Self-service signup, automated subscription billing, autonomous outbound AI campaigns, and a native mobile app are not MVP requirements. The inbound AI receptionist flow is a core MVP requirement.

## Fixed MVP decisions

- Retain the existing Express, TypeScript, MongoDB/Mongoose, React, and AdminJS architecture.
- Do not rewrite the application in Next.js or replace the entire frontend.
- Use the latest supported **LTS** Node.js version. As of August 2026, the target is Node.js 24 LTS; verify compatibility before changing the runtime.
- Upgrade AdminJS and related adapters to mutually compatible supported versions before removing the temporary Node 16 launcher.
- Upgrade Mongoose incrementally. Do not combine an AdminJS migration, runtime migration, Mongoose major migration, and UI rewrite in one commit.
- Implement shared-database multitenancy using `dealershipId` on tenant-owned records.
- For the pilot, each user belongs to one dealership. Defer multi-dealership memberships until a real customer requires them.
- Keep manual onboarding and manual invoicing for the pilot.
- Treat inbound AI lead qualification and appointment booking as the primary product vertical slice.
- Preserve Twilio as the initial SMS provider unless the recovery audit proves that a different production provider was used.
- Inventory and export the legacy AWS/Twilio implementation before replacing it. Do not invoke unknown live endpoints during discovery.
- Make the CRM the system of record. External AWS/AI code must use authenticated, tenant-scoped CRM APIs and must not connect directly to MongoDB.
- Resolve a dealership from the Twilio destination number or another server-owned mapping; never trust a client-supplied `dealershipId`.
- Keep mock SMS as the default in every non-production environment.
- Keep mock telephony and mock AI providers as the default in automated tests.
- Require an explicit production feature flag and credentials before any real SMS provider can send.
- Do not add Redis until a demonstrated workload requires it. Use a MongoDB-backed outbox/job model for the MVP.
- Store timestamps in UTC and render them using each dealership's configured timezone.
- Use one package manager and one lockfile after the runtime migration is proven.

## Current baseline that must be preserved

The working tree already contains uncommitted local-startup and testing improvements. Before editing, inspect `git status` and the full diff. Do not discard or overwrite these changes.

Existing improvements include:

- Windows-safe AdminJS component path resolution.
- Same-origin `/api/...` URLs instead of the obsolete hard-coded server IP.
- `npm.cmd run dev:local`, which starts a local persistent MongoDB development instance.
- An idempotently seeded demo customer.
- A loopback-only mock SMS service on port 3435.
- `npm.cmd run test:smoke`, which verifies AdminJS → API → MongoDB → mock SMS.

Current known defects include:

- Node 24 cannot run the pinned AdminJS 7.2 dependency.
- Database startup is not truly awaited and failures can occur after the server announces readiness.
- Production session and cookie secrets are hard-coded.
- Development bypasses authentication.
- There is no tenant model or tenant isolation.
- The campaign API lacks authentication, consent enforcement, recipient limits, rate limiting, idempotency, and duplicate-send protection.
- Campaign form callbacks contain stale-state/debounce defects.
- Some customer filters are ignored, and filtered totals are incorrect.
- `textPreferred` is used by local/demo data and TypeScript but is not persisted by the current customer schema.
- Several dashboard charts contain sample data.
- Seed behavior is incomplete and can report success after individual failures.
- Docker and Windows scripts are inconsistent and not production-ready.
- There is no CI pipeline, production monitoring, or documented backup/restore procedure.
- The CRM contains a read-only customer/bot conversation model, but no code that receives Twilio events or writes AI conversations.
- Historical code points to an AWS API Gateway route named `IncomingSMSHandler` and a later Lambda Function URL in `us-east-1`; that implementation is not in this repository.
- The legacy Git history contains a real-looking MongoDB credential and public AWS endpoint URLs. Treat the old database credential and any Lambda-held Twilio/AI credentials as compromised until rotated or proven revoked.

## Claude working rules

1. Begin every phase by reading this document, `package.json`, relevant source files, and the current git diff.
2. Preserve user changes and unrelated work. Never use `git reset --hard` or discard files to obtain a clean tree.
3. State the phase scope and expected files before editing.
4. Prefer small migrations and compatibility shims over big-bang replacements.
5. Add or update tests in the same phase as the behavior being changed.
6. Do not push, deploy, send real messages, create paid resources, or alter production data without explicit approval.
7. Never commit `.env`, credentials, customer data, phone numbers, or provider tokens.
8. Never use the real SMS endpoint in automated or manual tests.
9. Do not proceed through a failed acceptance gate. Diagnose and fix the current phase first.
10. End each phase with: changed files, commands run, passing evidence, risks, migration notes, and recommended next phase.

---

# Phase 0 — Baseline and safety checkpoint

## Objective

Establish a reproducible baseline without changing product behavior.

## Tasks

- Inspect the entire current git diff and identify which changes predate the MVP work.
- Run the current local startup and smoke test.
- Record current versions, runtime failures, environment variables, ports, and external dependencies.
- Create a sanitized `.env.example` that contains placeholders only. Remove any real-looking public messaging endpoint.
- Add scripts for `typecheck`, `test`, and `test:smoke` if they are not already clear and cross-platform.
- Document the existing data model and request flow.
- Produce a legacy integration recovery manifest without calling any live endpoint: historical AWS URLs/resource names, expected Twilio webhooks, conversation schema, customer fields, appointment fields, and every known environment-variable name.
- If account access is available, inspect Twilio and AWS read-only: record configuration and export code/configuration after redacting secrets. Do not change webhooks, publish Lambda versions, or test-send messages during discovery.
- Create an explicit migration ledger for every future schema change.

## Acceptance gate

- `npm.cmd run dev:local` starts without an external database or API key.
- `npm.cmd run test:smoke` passes.
- `npm run build` passes.
- No real network message can be sent in local mode.
- No secrets or customer data appear in tracked files.

---

# Phase 1 — Runtime and application reliability

## Objective

Run reliably on a supported LTS runtime without the temporary Node 16 execution path.

## Tasks

### Dependency migration

- Target Node.js 24 LTS, but first verify that the selected AdminJS release and adapters support it.
- Upgrade AdminJS from 7.2 to the latest compatible 7.x release and upgrade `@adminjs/express`, `@adminjs/mongoose`, import/export, themes, and design-system packages as one compatibility set.
- Upgrade Mongoose separately, preferably 7 → 8 first. Do not jump directly to another major unless tests justify it.
- Remove duplicated Material UI generations where practical. Do not redesign the UI in this phase.
- Standardize on one package manager and regenerate only its lockfile after a clean install succeeds.

### Startup and configuration

- Make `Database.connect()` return and await the connection promise.
- Fail startup with a clear non-zero exit code when MongoDB is unavailable.
- Add validated environment configuration with separate development, test, and production requirements.
- Remove hard-coded cookie/session secrets.
- Add graceful shutdown for HTTP, MongoDB, mock SMS, and background workers.
- Add `/health/live` and `/health/ready` endpoints.
- Replace platform-specific scripts with cross-platform commands.
- Add structured startup and error logs without sensitive payloads.

## Required tests

- Supported Node LTS starts the app on Windows and Linux/container CI.
- Missing `MONGO_URL`, session secret, or required production setting fails clearly.
- Readiness stays unsuccessful until MongoDB is available.
- SIGTERM closes connections and exits cleanly.
- Existing smoke test remains green.

## Acceptance gate

- No Node 16 or `npm exec --package=node@16` workaround remains.
- Clean install, build, start, shutdown, and smoke test all pass on Node LTS.
- A database connection failure never produces a misleading “server started” state.

---

# Phase 2 — Dealership tenancy, authentication, and authorization

## Objective

Guarantee that one dealership can never read or modify another dealership's data.

## Data model

Add a `Dealership` model with at least:

- `name`
- `status`
- `timezone`
- `createdAt` / `updatedAt`

Add `dealershipId` to every tenant-owned model:

- Admin/user
- Customer
- Car
- Sales representative
- Appointment
- Desk log/opportunity
- Blast/campaign
- Conversation/message

Add compound indexes such as `{ dealershipId, email }`, `{ dealershipId, VIN }`, and other query-specific combinations. Global uniqueness must not accidentally prevent two dealerships from storing legitimate matching values.

## Tasks

- Backfill existing records into a default development dealership through a reversible migration.
- Perform tenancy migration in safe stages: add nullable fields, back up, dry-run and report, backfill in batches, validate zero unassigned/cross-tenant references, create compound indexes, and only then make `dealershipId` required.
- Establish an authenticated request context containing `userId`, `dealershipId`, and role.
- Create roles: `owner`, `manager`, and `sales`.
- Centralize tenant-scoped data access. Avoid scattered raw `Model.find()` calls that omit `dealershipId`.
- Scope every REST route and every AdminJS list/show/new/edit/delete action.
- Scope AdminJS bulk actions, dashboard handlers, reference selectors, filters, imports, and exports. Disable generic import/export until this is proven by tests.
- Prevent users from supplying or changing `dealershipId` through request payloads.
- Use secure password hashing, server-side sessions, environment-provided secrets, secure production cookie settings, and session rotation after login.
- Use same-origin CORS, CSRF protection for mutations, request/body limits, and deny-by-default authorization.
- Add login throttling and basic HTTP security headers.
- Allow owners/managers to invite or create dealership users. Self-service dealership registration is deferred.
- Add an append-only audit record for sensitive mutations and campaign launches.

## Required tests

- User A cannot list, fetch, edit, delete, reference, export, or campaign-message Dealership B records.
- Guessing another tenant's MongoDB ID returns 404 or 403 without revealing the record.
- Sales users cannot perform owner-only actions.
- Session expiry, logout, disabled users, and invalid credentials behave correctly.
- Import/export remains tenant-scoped.

## Acceptance gate

- Automated cross-tenant isolation tests cover every tenant-owned resource and campaign route.
- No authenticated product route operates without a verified tenant context.
- Security review finds no client-controlled tenant selector in database queries.

---

# Phase 3 — Complete the core dealership workflow

## Objective

Make the non-messaging CRM useful during normal dealership work.

## Tasks

### Customers and leads

- Repair filtering, combined-filter state, pagination, and filtered totals.
- Reduce unnecessarily required customer fields and distinguish required, optional, and derived values.
- Add lead owner, lead status, source, last-contact date, and next-follow-up date.
- Add duplicate detection for email and normalized phone numbers within a dealership.
- Provide a CSV template, dry-run import preview, row-level errors, and idempotent import behavior.

### Inventory

- Enforce dealership-scoped VIN uniqueness.
- Support status, pricing, mileage, location, and image URLs with validation.
- Add import/export suitable for a pilot dealership.

### Appointments and desk log

- Replace string-based timestamps with proper dates.
- Handle dealership timezone display explicitly.
- Support assignment to a salesperson, appointment status, notes, and outcome.
- Make deal status transitions explicit and validated.
- Keep DeskLog as the MVP deal pipeline. Do not introduce a second competing Opportunity workflow during the pilot.

### Dashboard

- Replace every sample chart with database-backed metrics.
- Implement at minimum: appointments today, active leads, lead-to-appointment conversion, sales/deals by period, and inventory aging.
- Define each metric in code and documentation so dealerships interpret it consistently.

## Required tests

- CRUD and validation tests for the primary resources.
- Combined customer filters and filtered total tests.
- CSV dry-run, partial failure, duplicate, and replay tests.
- Date/timezone boundary tests.
- Dashboard aggregation tests using deterministic fixtures.

## Acceptance gate

A manager can import customers and inventory, assign a lead, schedule an appointment, advance a deal, and see the dashboard update without manual database work.

---

# Phase 4 — AI concierge, Twilio, and safe messaging

## Objective

Deliver the product's primary workflow: a customer calls or texts a dealership number, an AI concierge qualifies the lead, and a verified customer, conversation, and confirmed appointment appear in the correct dealership's CRM. Also allow controlled campaigns without accidental, duplicate, unauthorized, or non-consensual sends.

## Tasks

### Recover the legacy integration first

- Check Twilio phone-number configuration for inbound Messaging and Voice webhook URLs plus status callbacks.
- In AWS `us-east-1`, locate the historical API Gateway/Lambda resources associated with `IncomingSMSHandler` and the known Lambda Function URL. Export code, runtime, layers, event sources, aliases, environment-variable names, IAM policy summary, and CloudWatch log-group names without exposing values or customer data.
- Determine whether calls used Twilio Voice, Amazon Connect, or another provider. Do not infer the voice provider from the SMS evidence.
- Determine which AI provider/model was used. The CRM repository does not establish that OpenAI or any other model provider was present.
- Identify whether the external function wrote directly to MongoDB. If it did, preserve behavior only long enough to migrate it behind authenticated CRM integration APIs.
- Rotate/revoke historical MongoDB, Twilio, AI, and AWS application credentials before reconnecting any recovered code.
- Write an ADR that chooses reuse, contained modernization, or replacement based on the recovered source and operational state. Do not rebuild blindly before this gate.

### Inbound AI concierge

- Introduce `TelephonyProvider` and `AiAgentProvider` interfaces with deterministic mock implementations for local and automated tests.
- Map each Twilio destination number to exactly one dealership using server-owned configuration.
- Add authenticated integration endpoints for inbound messages/calls, provider status callbacks, conversations, customer upsert, appointment availability, appointment creation, and human handoff.
- Validate Twilio webhook signatures against the exact public URL and reject unsigned or replayed events.
- Store provider event IDs and enforce idempotency before performing any customer, conversation, or appointment mutation.
- Normalize the caller's phone number to E.164 and find or upsert a customer within the mapped dealership without creating duplicates.
- Persist the full conversation as structured turns with provider IDs, channel, direction, timestamps, delivery state, and a redacted operational summary.
- Give the AI an allowlisted tool contract. It may collect contact details, vehicle interest, budget/trade-in preferences, query appointment availability, propose times, create a confirmed appointment, and request human handoff. It must not execute arbitrary database queries or accept hidden tenant identifiers from prompts.
- Require explicit customer confirmation of the selected time before appointment creation. Store timezone, channel, source conversation, assigned salesperson or queue, and confirmation status.
- Handle ambiguous identity, duplicate leads, invalid dates, unavailable time slots, after-hours contact, AI/provider errors, customer requests for a person, and emergency or abusive content with deterministic fallbacks.
- Separate conversational text from trusted structured fields. Validate every AI tool argument server-side and defend against prompt injection contained in customer messages or inventory data.
- Add an inbox/timeline that lets staff see the transcript, AI summary, extracted lead fields, appointment, delivery state, and handoff status together.

### Outbound and campaign messaging

- Introduce an `SmsProvider` interface with `MockSmsProvider` and a Twilio production implementation only after account recovery and approval.
- Separate the campaign definition from per-recipient delivery records. Preserve the final audience and message snapshot used for each send.
- Default to mock mode outside production.
- Require a production-only enable flag in addition to provider credentials.
- Record consent source, consent timestamp, opt-out timestamp, and preferred contact method.
- Exclude opted-out or ineligible recipients on the server, regardless of the UI selection.
- Validate that campaigns contain 1–100 recipients for the pilot, with a configurable limit.
- Add audience preview, eligible/excluded counts, message preview, and explicit confirmation.
- Use an idempotency key to prevent double clicks and request retries from duplicating a campaign.
- Store campaign and recipient statuses: `draft`, `queued`, `sending`, `sent`, `failed`, `skipped`, and `cancelled` as appropriate.
- Use a MongoDB-backed outbox/worker with bounded retries and clear failure reasons.
- Recheck consent immediately before delivery, enforce configured quiet hours, and cap sends per dealership.
- Interpolate only documented, escaped template fields. Reject unknown placeholders.
- Add rate limiting and role checks to campaign creation and launch.
- Display delivery progress and errors in the UI.
- Support provider opt-out callbacks before enabling real pilot messaging.
- Verify provider webhook signatures and store provider message IDs and delivery events.

## Required tests

- All automated tests use the mock provider.
- Signed/unsigned Twilio webhook, destination-number tenant mapping, duplicate/replayed provider event, and cross-tenant tests.
- Multi-turn qualification tests for new and existing customers, partial information, customer deduplication, explicit appointment confirmation, slot conflicts, timezones, and human handoff.
- AI tool arguments are schema-validated; prompt-injection attempts cannot select another tenant, bypass confirmation, or invoke unapproved actions.
- A complete deterministic flow proves: mock inbound text/call -> mock AI -> customer upsert -> conversation -> confirmed appointment -> staff-visible CRM timeline.
- Consent exclusion, opt-out, recipient limit, template validation, idempotency, retry, and partial failure tests.
- Double-clicking Launch produces one campaign.
- A salesperson cannot launch if the dealership's policy restricts that role.
- No real endpoint is referenced by test fixtures or `.env.example`.

## Acceptance gate

- The deterministic inbound concierge flow passes without AWS, Twilio, or AI API keys.
- In staging, one allowlisted Twilio number and one approved AI provider complete the same flow with signatures, logs, costs, and failure alerts verified.
- A duplicate webhook or model retry cannot duplicate the customer, conversation turn, or appointment.
- The AI cannot write directly to MongoDB and cannot operate without an authenticated dealership context.
- The complete UI → API → MongoDB outbox → mock provider → delivery-status flow passes.
- Real messaging remains impossible until production credentials and the explicit enable flag are present.
- A documented manual safety review is completed before the first real pilot message.

---

# Phase 5 — Focused UI modernization

## Objective

Make the product credible and efficient without delaying validation for a full redesign.

## Scope

Modernize these surfaces first:

1. Application shell, navigation, and branding.
2. Dashboard.
3. AI conversation inbox and human-handoff workflow.
4. Customer list/detail and follow-up workflow.
5. Appointment workflow.
6. Campaign builder and delivery status.

## Tasks

- Establish design tokens for color, typography, spacing, borders, and states.
- Use one component system; avoid continuing the MUI v4/v5 mixture.
- Add responsive layouts for dealership laptops and tablets.
- Add consistent loading, empty, validation, success, and error states.
- Replace alerts and console-only failures with actionable in-product feedback.
- Ensure keyboard navigation, labels, focus states, contrast, and table usability.
- Keep standard AdminJS CRUD pages where they are sufficient.
- Do not build a separate frontend application during the MVP unless pilot evidence proves AdminJS cannot support a required workflow.

## Acceptance gate

- The five priority surfaces work at common laptop and tablet widths.
- Critical workflows can be completed without browser console access.
- Accessibility smoke checks and end-to-end browser tests pass.

---

# Phase 6 — Production, operations, and paid-pilot readiness

## Objective

Operate the MVP safely for real dealerships.

## Tasks

- Create a multi-stage, non-root Node LTS Docker image.
- Fix Compose volume behavior, pin infrastructure versions, and add health checks.
- Use managed MongoDB with TLS, least-privilege credentials, backups, and tested restore instructions.
- Create separate development, test, staging, and production configuration.
- Add CI for clean install, formatting, typecheck, build, unit tests, integration tests, tenant-isolation tests, and smoke tests.
- Add centralized error tracking, structured request logs, uptime checks, and campaign failure alerts.
- Add request IDs and audit-event correlation without logging message bodies, passwords, phone numbers, email addresses, or other unnecessary customer data.
- Run the web application and MongoDB outbox worker as independently restartable processes.
- Write runbooks for deploy, rollback, database migration, backup restore, provider outage, and suspected tenant-data exposure.
- Add Terms, Privacy, acceptable-use, consent/opt-out, data retention, and support documentation. Obtain qualified legal review before handling real customer communications.
- Use a manual invoice or payment link for the pilot. Defer complex subscription billing and self-service cancellation.
- Create dealership onboarding, CSV mapping, user training, and offboarding checklists.

## Acceptance gate

- Staging passes the full release checklist from a clean environment.
- Backup restoration is demonstrated, not merely configured.
- Tenant-isolation tests are required CI checks.
- No production secret exists in git history or tracked files.
- A pilot dealership can be onboarded from a written checklist in one business day or less.

---

# Phase 7 — Paid pilot and validation

## Objective

Validate product value before expanding scope.

## Pilot approach

- Recruit 2–3 independent dealerships.
- Run a four-week pilot with weekly feedback sessions.
- Onboard manually and maintain a visible issue log.
- Track usage and outcomes without collecting unnecessary personal data.

## Minimum success signals

- At least two dealerships use the product weekly for four consecutive weeks.
- Managers import real operational data successfully.
- Salespeople create appointments and update deal status without developer intervention.
- No tenant-isolation or data-loss incident occurs.
- Backup/restore and export work with pilot data.
- At least one dealership agrees to continue as a paying customer.

Only after these signals should the roadmap consider self-service billing, native mobile applications, AI-assisted follow-up, voice automation, advanced DMS integrations, or a full custom frontend.

---

# Priority backlog

## P0 — Required before a paid pilot

- Supported runtime and dependency set
- Awaited database startup and graceful shutdown
- Configuration validation and secure secrets
- Dealership tenancy and isolation tests
- Authentication and role authorization
- Core customer/inventory/appointment/deal workflows
- Twilio/AWS recovery audit and credential rotation
- Tenant-mapped inbound call/text webhook pipeline
- AI lead qualification, conversation persistence, customer upsert, and confirmed appointment booking
- Human handoff and provider/AI failure fallbacks
- Safe mock-first messaging architecture
- Consent, opt-out, rate limit, idempotency, and campaign audit trail
- Real dashboard metrics
- Production deployment, monitoring, backup, and restore
- CI release gate

## P1 — Strongly preferred during the pilot

- CSV preview and duplicate handling
- Focused UI modernization
- Improved campaign delivery UI
- User invitations and password reset
- Operational audit log viewer
- Onboarding and support documentation

## P2 — Explicitly deferred

- Autonomous outbound AI campaigns
- AI negotiation, financing decisions, or promises about price/availability
- Advanced voice features beyond inbound qualification, appointment booking, and human handoff
- Native iOS/Android applications
- Broad DMS integrations without a pilot requirement
- Complex subscription billing
- Self-service dealership signup
- Advanced forecasting and custom report builders
- Full frontend rewrite
- Redis or distributed queues without measured need

---

# Release definition of done

The MVP is ready for a paid pilot only when all of the following are true:

- It runs on a supported Node LTS release without compatibility wrappers.
- A clean environment can install, build, migrate, start, test, and stop using documented commands.
- Authentication is required in every environment except explicitly isolated tests.
- Tenant isolation is enforced and tested for every resource and export.
- Core dealership workflows use real persisted data.
- A signed inbound Twilio event is mapped to the correct dealership and can drive the AI-assisted customer/conversation/confirmed-appointment flow without duplicate writes.
- Staff can review the AI transcript, extracted lead information, appointment, and handoff state in one CRM timeline.
- Messaging is mock-first, consent-aware, idempotent, limited, audited, and explicitly enabled in production.
- Dashboard metrics are real and documented.
- Production has monitoring, backups, a tested restore, and rollback instructions.
- CI blocks releases when build, isolation, integration, or smoke tests fail.
- Onboarding and offboarding are documented.
- No secret or real customer fixture is tracked.

---

# Copy/paste kickoff prompt for Claude

```text
You are working in the Pegasus dealership CRM repository.

Read MVP_IMPLEMENTATION_PLAN.md completely, then inspect package.json, the current git status, and the full git diff. Preserve all existing user changes. Do not reset, discard, deploy, push, or send real messages.

Your assignment is Phase 0 only: preserve the current work, establish a reproducible baseline, and produce a narrow, evidence-backed Phase 1 runtime migration proposal. Do not begin the dependency migration, multitenancy, UI redesign, or product workflow changes yet.

Before editing:
1. Summarize the existing architecture and current uncommitted changes.
2. Reproduce the existing build, local startup, smoke test, and Node 24 runtime failure.
3. Record the current Node 16, Node 24, AdminJS, Mongoose, package-manager, Docker, environment, and external-service constraints.
4. Trace the legacy Twilio/AWS contract from source and Git history without invoking any external endpoint. Record the historical `IncomingSMSHandler`, Lambda Function URL reference, conversation model, customer/appointment models, and missing inbound write path. Redact all credential values.
5. Produce an account-recovery checklist for Twilio and AWS `us-east-1`, including exactly what to inspect and export read-only. Do not request that secrets be pasted into chat.
6. Flag every credential or live-looking endpoint found in tracked files or history and provide rotation/revocation guidance.
7. Propose the exact Phase 1 dependency migration sequence and list the files you expect it to change.
8. Identify any decision that requires user approval.

Implementation constraints:
- Keep Express, MongoDB/Mongoose, React, and AdminJS.
- Treat Node 24 LTS as the Phase 1 target, but verify dependency support and do not upgrade dependencies in this Phase 0 run.
- Preserve the existing yarn lockfile unless I explicitly approve a package-manager migration.
- Keep local SMS mocked and make real sends impossible in tests.
- Do not call the historical API Gateway/Lambda endpoints, alter a Twilio webhook, invoke a function, or send a test message.
- Treat the inbound AI receptionist workflow as the core product, but do not implement it during Phase 0.
- Sanitize `.env-example` so it contains placeholders only.
- Document current Windows/Linux startup limitations and the exact clean-checkout setup commands.
- Preserve and run the existing smoke test; add no broad framework or dependency changes.

Stop after the Phase 0 acceptance gate. Report changed files, commands run, test evidence, remaining risks, and the proposed Phase 1 migration sequence. Do not begin Phase 1 until I approve it.
```

## Reference links to re-check during implementation

- Node.js supported releases: https://nodejs.org/en/about/previous-releases
- AdminJS installation and ESM guidance: https://docs.adminjs.co/installation/getting-started
- AdminJS v7 migration guidance: https://docs.adminjs.co/installation/migration-guide-v7
- Mongoose migration documentation: https://mongoosejs.com/docs/migrating_to_9.html
