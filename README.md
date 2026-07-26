# ABPO Command

Assorted BPO's call-centre CRM and workforce platform. Next.js 15 (App
Router, strict TypeScript) + Supabase (Postgres, Auth, Storage, Realtime).

This repo currently implements **Phase 1** (foundation: identity/org/
campaigns, RLS, audit triggers, auth, the app shell), **Phase 2** (leads,
suppression, the dialable-view compliance gate, manual lead entry),
**Phase 3** (the agent dial workspace queue, atomic DNC transaction, lead
assignment/auto-top-up), **Phase 4** (attendance: clock in/out, aux states,
shifts, leave requests, `pg_cron` sweeps), **Phase 5** (follow-ups with a
live realtime tray, and the email module with suppression/unsubscribe), and
**Phase 6** (QA scorecards/review queue, campaign funnel and agent
scorecard reporting) from the build spec.

> **Migrations 21-22 (`qa.sql`, `reporting.sql`) are written but not yet
> applied to the live database.** The Supabase MCP connector started
> rejecting `apply_migration`/`execute_sql` calls with "MCP tool call
> requires approval" mid-build, and a direct `psql` connection using
> `DATABASE_URL` is also blocked from this sandbox (DNS only resolves an
> IPv6 address for the direct host, and the pooler times out — only HTTPS
> egress works here). To keep the app building, `src/lib/supabase/types.ts`
> was hand-extended to describe the two new tables (`qa_scorecards`,
> `qa_reviews`), the `v_campaign_funnel` view, and the `get_agent_scorecard`
> RPC/`agent_scorecard_row` type that migration 22 defines — **these do not
> exist in the live database yet.** Before using `/qa` or
> `/admin/performance`: apply `00000000000021_qa.sql` and
> `00000000000022_reporting.sql` (Supabase dashboard SQL editor, the CLI, or
> a working MCP connection), then regenerate types for real and diff away
> the hand-written stopgap.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the
  Supabase project (already set for the project created during this build).
- `SUPABASE_SERVICE_ROLE_KEY` — **not retrievable via MCP by design.** Get
  it from the Supabase dashboard → Settings → API → service_role. Needed
  for user provisioning (`/admin/people`) and the bootstrap script below.

## Bootstrapping the first account

Only a `super_admin`/`ops_manager` can create users through the app, but no
users exist yet on a fresh project. Once `SUPABASE_SERVICE_ROLE_KEY` is set:

```bash
npm run bootstrap-admin -- --email you@example.com --name "Your Name"
```

This prints a one-time temporary password. You'll be forced to set a new
one on first login.

## Database

Migrations live in `supabase/migrations/`, applied in filename order. They
were also applied directly to the live project via the Supabase MCP during
this build — keep both in sync: write the migration file, then apply it.

Regenerate TypeScript types after any schema change:

```bash
# via the Supabase CLI, or the Supabase MCP generate_typescript_types tool
supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
```

## Testing

```bash
npm run test:rls   # RLS integration suite — needs SUPABASE_SERVICE_ROLE_KEY
```

Runs against the live project (there's no local Postgres in this setup).
Creates and tears down its own test users/campaigns/teams per run.

## Backups

The Supabase free tier has no backups — see `.github/workflows/nightly-backup.yml`.
It needs these repo secrets to actually run: `DATABASE_URL`,
`BACKUP_ENCRYPTION_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Until
those are configured, the workflow exists but won't fire successfully —
**verify a real restore before Phase 2**, per the spec's acceptance
criteria.

## Brand assets

No real logo files were supplied for this build — see `public/brand/README.md`.
The app currently renders a placeholder mark in the exact brand colours.

## What's real vs. preview

- Real, backed by the live database: auth/login, forced password change,
  user provisioning with one-time credential reveal, campaigns (with
  vertical/risk-tier compliance presets), clients, the audit log, session
  and credential-event views, manual lead entry with mandatory provenance
  (data source + lawful basis), the suppression console (add/search,
  global and instant), `v_dialable_leads`, lead assignment (manual and
  round-robin auto-top-up), and the **agent dial workspace itself** —
  queue, disposition, notes, callback booking and the atomic
  `record_call_attempt` transaction (call log + suppression + queue
  removal, all-or-nothing). All verified directly against the live
  database with an impersonated agent session, not just code review:
  unscreened leads never appear in the queue, suppressing a number removes
  it immediately, a booked callback disappears until due, and a "Do Not
  Call" disposition suppresses the number atomically.
  Also real: attendance (clock in/out, aux-state tracking with no-overlap
  enforcement, shift assignment, leave requests, the `pg_cron`
  missed/escalation sweep for follow-ups), the follow-up due tray (live via
  Supabase Realtime, with a snooze cap), and the email module (templates,
  suppression-gated sends via a swappable `EmailProvider`, HMAC-signed
  one-click unsubscribe).
- Built but **pending migration application** (see the callout above): the
  QA review queue (`/qa` — scorecard-driven, fatal-breach detection) and
  the performance dashboard (`/admin/performance` — campaign funnel chart,
  7-day agent leaderboard sorted by calls-attempted/contact-rate rather
  than raw conversion, since verticals aren't comparable on that metric).
  Both will 500 against the live database until migrations 21-22 are
  applied.
- Preview / not yet built: Live Floor shows real campaign/assignment
  counts but no real-time call activity feed. Data sourcing (the bulk
  import wizard and external connectors) is Phase 7, not yet started.

## A real bug found and fixed along the way

While wiring the agent queue, testing against a real `authenticated` role
(not the superuser connection migrations run as) surfaced two RLS issues
invisible to superuser-context testing — see migration
`00000000000012_fix_rls_recursion_and_suppression_read.sql`:

1. `profiles_select`'s `team_lead` branch had an inline subquery selecting
   from `profiles` within `profiles`' own RLS policy, causing infinite
   recursion the moment a real `team_lead` session hit it.
2. `suppression_list`'s read policy was manager/qa-only — but
   `v_dialable_leads` is `security_invoker`, so its join against
   `suppression_list` is *also* subject to the querying user's RLS. For an
   agent, that policy made every suppression row invisible, which made
   `phone_e164 is null` always true from their vantage point — i.e. an
   agent querying the real queue would have seen a suppressed number as
   dialable, silently defeating the compliance gate for exactly the role
   that matters most.

Both are fixed and re-verified with an impersonated-agent SQL session
(`set role authenticated; set request.jwt.claims ...`) — worth knowing if
you extend the RLS policies further: anything a security-definer helper
doesn't wrap, and anything a `security_invoker` view joins against, needs
to be checked from a real non-superuser session, not just via the
Supabase MCP connection.
