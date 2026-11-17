# Contributing

Thanks for your interest! This is a small template, so contributions are kept
simple.

1. Open an issue first for anything bigger than a typo, so we can agree on the
   approach.
2. Fork, branch from `main`, and keep the change focused.
3. Before opening a pull request, run:

   ```bash
   npm ci
   npm run lint
   npm run build
   supabase start && supabase test db
   ```

4. Schema changes go in a **new** migration under `supabase/migrations/` (never
   edit an applied one) and come with pgTAP tests in `supabase/tests/`.
5. Keep the security invariants described in the README: no `.select()` after
   inserts with the anon key, `consent_at` / `policy_version` / `confirmed_at`
   stay without defaults, and no secrets with a `NEXT_PUBLIC_` prefix.
6. Never commit `.env.local`, real keys or personal data, not even in tests.

Security issues: see [SECURITY.md](SECURITY.md) instead of opening an issue.
