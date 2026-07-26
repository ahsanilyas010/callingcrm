# ABPO Command

Assorted BPO's call-centre CRM and workforce platform. Next.js 15 (App
Router, strict TypeScript) + Supabase (Postgres, Auth, Storage, Realtime).

This repo currently implements **Phase 1** (foundation: identity/org/
campaigns, RLS, audit triggers, auth, the app shell) and the core of
**Phase 2** (leads, suppression, the dialable-view compliance gate, manual
lead entry) from the build spec, plus a fully-animated preview of the agent
dial workspace ahead of Phase 3 wiring it to the real queue.

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
  global and instant), and `v_dialable_leads` — verified directly against
  the live database that an unscreened lead never appears and that adding
  a number to `suppression_list` removes it from the view immediately.
- Preview only (mock data, clearly labelled in the UI): the agent dial
  workspace (`/workspace`) and Live Floor, since the queue itself
  (Phase 3) isn't wired up yet — the underlying `v_dialable_leads` view it
  will query is real and tested. Performance, Attendance, Data sourcing
  (the bulk import wizard) and QA are placeholder screens pointing at the
  phase that builds them for real.
