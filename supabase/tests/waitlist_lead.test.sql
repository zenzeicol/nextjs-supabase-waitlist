-- pgTAP tests for public.waitlist_lead. Run with: supabase test db
begin;

select plan(20);

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select has_table('public', 'waitlist_lead', 'waitlist_lead exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.waitlist_lead'::regclass),
  true,
  'RLS is enabled on waitlist_lead'
);

select col_hasnt_default('public', 'waitlist_lead', 'consent_at', 'consent_at has no default (on purpose)');
select col_hasnt_default('public', 'waitlist_lead', 'policy_version', 'policy_version has no default (on purpose)');

select table_privs_are(
  'public', 'waitlist_lead', 'anon', array['INSERT'],
  'anon only has INSERT on waitlist_lead'
);
select table_privs_are(
  'public', 'waitlist_lead', 'authenticated', array['INSERT'],
  'authenticated only has INSERT on waitlist_lead'
);
select ok(
  has_table_privilege('service_role', 'public.waitlist_lead', 'SELECT')
    and has_table_privilege('service_role', 'public.waitlist_lead', 'DELETE'),
  'service_role can read and delete leads (trusted server only)'
);

-- ---------------------------------------------------------------------------
-- As anon (what the Next.js Server Action uses)
-- ---------------------------------------------------------------------------
set local role anon;

select lives_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, utm_source, consent_at, policy_version)
     values ('ada@example.com', 'Ada Example', '+1 555 0100', 'ios', 'test', now(), '1.0') $$,
  'anon can insert a complete lead'
);

select throws_ok(
  $$ select * from public.waitlist_lead $$,
  '42501', null,
  'anon cannot SELECT from waitlist_lead'
);

select throws_ok(
  $$ update public.waitlist_lead set name = 'Changed' $$,
  '42501', null,
  'anon cannot UPDATE waitlist_lead'
);

select throws_ok(
  $$ delete from public.waitlist_lead $$,
  '42501', null,
  'anon cannot DELETE from waitlist_lead'
);

-- TRUNCATE is not subject to RLS, so only the missing privilege stops it.
select throws_ok(
  $$ truncate public.waitlist_lead $$,
  '42501', null,
  'anon cannot TRUNCATE waitlist_lead'
);

select throws_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, policy_version)
     values ('no-consent@example.com', 'No Consent', '+1 555 0101', 'android', '1.0') $$,
  '23502', null,
  'insert without consent_at fails (not null, no default)'
);

select throws_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, consent_at)
     values ('no-version@example.com', 'No Version', '+1 555 0102', 'android', now()) $$,
  '23502', null,
  'insert without policy_version fails (not null, no default)'
);

select throws_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, consent_at, policy_version)
     values ('bad-platform@example.com', 'Bad Platform', '+1 555 0103', 'windows', now(), '1.0') $$,
  '23514', null,
  'insert with an unknown platform fails the CHECK'
);

select throws_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, consent_at, policy_version)
     values ('ada@example.com', 'Ada Again', '+1 555 0100', 'ios', now(), '1.0') $$,
  '23505', null,
  'a repeated email fails with unique_violation (the app treats it as success)'
);

-- The `.insert().select()` trap: PostgREST turns it into INSERT ... RETURNING,
-- and RETURNING needs SELECT privilege, which anon does not have.
select throws_ok(
  $$ insert into public.waitlist_lead (email, name, phone, platform, consent_at, policy_version)
     values ('returning@example.com', 'Returning', '+1 555 0104', 'ios', now(), '1.0')
     returning id $$,
  '42501', null,
  'INSERT ... RETURNING (what .insert().select() does) fails for anon'
);

reset role;

set local role service_role;
select lives_ok(
  $$ select count(*) from public.waitlist_lead $$,
  'service_role can read waitlist_lead'
);
reset role;

-- ---------------------------------------------------------------------------
-- Back as the table owner: check what actually got stored
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from public.waitlist_lead where email = 'ada@example.com'),
  1,
  'the valid lead was stored exactly once'
);

select is(
  (select count(*)::int from public.waitlist_lead where email = 'returning@example.com'),
  0,
  'the failed INSERT ... RETURNING left no row behind (the statement is atomic)'
);

select * from finish();
rollback;
