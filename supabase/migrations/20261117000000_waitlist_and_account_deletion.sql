-- Waitlist + account deletion request tables.
--
-- Security model: both tables are WRITE-ONLY for the public API roles.
--   * RLS enabled.
--   * Every privilege revoked from anon and authenticated, then only INSERT
--     granted back. The REVOKE makes the result independent of the default
--     privileges of your Supabase version: older projects grant ALL on new
--     `public` tables to anon/authenticated, and the local stack this was
--     tested on (CLI 2.109, Postgres 17) still grants TRUNCATE, REFERENCES and
--     TRIGGER. TRUNCATE is not subject to RLS, so it must not be left behind.
--   * A single INSERT policy. No SELECT/UPDATE/DELETE policy exists, and the
--     grants would block those anyway: defense in depth.
--   * service_role gets SELECT and DELETE explicitly, so a trusted server can
--     read the rows and remove them on request. service_role bypasses RLS but
--     still needs table privileges, and recent default privileges do not
--     include SELECT/DELETE.
--
-- Result: with the anon key you can add a row but never read, change or delete
-- one. Rows are read from the Supabase dashboard or with service_role on a
-- trusted server, never from the browser or the Next.js app.
--
-- Consequence for the app: an insert must NOT chain .select() (PostgREST's
-- `return=representation`), because reading back the new row needs SELECT and
-- fails with 42501. See "Why INSERT-only RLS" in the README.

-- ---------------------------------------------------------------------------
-- waitlist_lead
-- ---------------------------------------------------------------------------
create table public.waitlist_lead (
  id uuid primary key default gen_random_uuid(),

  -- The Server Action lowercases and trims the email before inserting.
  -- TODO(assumption): the unique constraint is case-sensitive. That is enough
  -- as long as every insert goes through lib/waitlist-action.ts; if other
  -- writers appear, consider a unique index on lower(email) instead.
  email text not null,

  name text not null,

  -- Stored exactly as typed (no normalization), see lib/waitlist-action.ts.
  phone text not null,

  -- Must match lib/platform.ts exactly, or every insert fails with 23514.
  platform text not null,

  utm_source text,

  -- Consent evidence. NO DEFAULT ON PURPOSE: the Server Action sets them only
  -- after validating the consent checkbox, so an insert that skips that step
  -- fails (23502) instead of silently recording consent nobody gave.
  --   consent_at     -> WHEN consent was given
  --   policy_version -> WHICH document was accepted (lib/policy.ts)
  consent_at timestamptz not null,
  policy_version text not null,

  created_at timestamptz not null default now(),

  -- 23505 on a repeated email; the Server Action treats it as success.
  constraint waitlist_lead_email_key unique (email),

  -- Length CHECKs are a safety ceiling, deliberately looser than the Server
  -- Action (which is the product rule: name 2-60, phone 7-20).
  -- TODO(assumption): the exact ceilings below are chosen for this template;
  -- they are not derived from any constraint visible in the application code.
  constraint waitlist_lead_email_length check (char_length(email) between 3 and 254),
  constraint waitlist_lead_name_length check (char_length(name) between 1 and 120),
  constraint waitlist_lead_phone_length check (char_length(phone) between 1 and 40),
  constraint waitlist_lead_platform_check check (platform in ('android', 'ios')),
  -- The Server Action truncates utm_source to 120 characters.
  constraint waitlist_lead_utm_source_length check (utm_source is null or char_length(utm_source) <= 120),
  -- TODO(assumption): 1-20 characters is enough for a version label like '1.0'.
  constraint waitlist_lead_policy_version_length check (char_length(policy_version) between 1 and 20)
);

comment on table public.waitlist_lead is
  'Waitlist sign-ups. Write-only for anon/authenticated (INSERT only). Read with service_role.';
comment on column public.waitlist_lead.consent_at is
  'When the person accepted the policy. Set by the server after validating consent. No default on purpose.';
comment on column public.waitlist_lead.policy_version is
  'Version of the policy that was accepted (lib/policy.ts). No default on purpose.';

alter table public.waitlist_lead enable row level security;

revoke all on table public.waitlist_lead from anon, authenticated;
grant insert on table public.waitlist_lead to anon, authenticated;
grant select, delete on table public.waitlist_lead to service_role;

create policy "Public can insert waitlist leads"
  on public.waitlist_lead
  for insert
  to anon, authenticated
  -- Field validation lives in the Server Action (product rules) and in the
  -- CHECK/NOT NULL constraints above (safety ceiling). The policy only decides
  -- WHO may insert.
  with check (true);

-- ---------------------------------------------------------------------------
-- account_deletion_request
-- ---------------------------------------------------------------------------
create table public.account_deletion_request (
  id uuid primary key default gen_random_uuid(),

  -- NO unique constraint on purpose: asking for deletion twice is legitimate,
  -- and since the app cannot read this table it could not tell a duplicate
  -- from a real error anyway. Deduplicate when processing.
  email text not null,

  -- Evidence that the person ticked the confirmation box. Set by the server.
  -- NO DEFAULT ON PURPOSE, same reasoning as waitlist_lead.consent_at.
  confirmed_at timestamptz not null,

  created_at timestamptz not null default now(),

  constraint account_deletion_request_email_length check (char_length(email) between 3 and 254)
);

comment on table public.account_deletion_request is
  'Account deletion requests. Write-only for anon/authenticated (INSERT only). Processed manually with service_role.';

alter table public.account_deletion_request enable row level security;

revoke all on table public.account_deletion_request from anon, authenticated;
grant insert on table public.account_deletion_request to anon, authenticated;
grant select, delete on table public.account_deletion_request to service_role;

create policy "Public can insert account deletion requests"
  on public.account_deletion_request
  for insert
  to anon, authenticated
  with check (true);
