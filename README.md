# One Impact

People-powered humanitarian platform: recurring member contributions, community voting on professionally vetted projects, and a public, tamper-evident financial ledger. Starting with Gaza.

> Prototype. All projects, members and amounts in the seed data are fictional.

## Run it

```bash
npm install
npm run db:setup   # creates prisma/dev.db and loads demo data (re-run any time to reset)
npm run dev        # http://localhost:3000
```

Sign in at `/login` with any demo account (dev-only sign-in). "Demo Admin" unlocks `/admin`.

## What's built (core loop)

- **Projects** (`/projects`): the 7-stage lifecycle (identified → proposed → professional review → community vote → funding authorized → implementation → completed), milestones, per-project money, and a public decision history.
- **Voting** (`/vote`): rounds with published rules. One verified member gets one vote per round (enforced by a DB unique index), there's a minimum turnout, and ties are broken deterministically.
- **Transparency** (`/transparency`): totals computed live from the ledger, plus an integrity check that re-hashes the whole chain on every page load.
- **Admin** (`/admin`): advance or reject projects (a reason is required and published), put reviewed projects on a ballot, close rounds, authorize funding (only for round winners, and only if the pool can cover the full budget), and record disbursements (capped at the project's reserve).

## Ledger design

`LedgerEntry` is append-only. Each row stores `sha256(seq, type, amount, memo, user, project, timestamp, prevHash)`, so editing or deleting any past row breaks the chain at that point (`src/lib/ledger.ts`). Corrections are new entries and never edits. Individual contributions are aggregated on public pages.

## Not built yet (before any real money)

- Real authentication and member identity verification (`src/lib/auth.ts` is a dev cookie).
- Payments (Stripe recurring billing), with contributions written to the ledger from webhooks.
- Postgres: change the `provider` in `prisma/schema.prisma`. With concurrent writers, ledger appends need a serializable transaction or an advisory lock.
- Member dashboard, team dashboards, notifications, complaints mechanism, audit exports, and emergency-procedure workflow UI.
