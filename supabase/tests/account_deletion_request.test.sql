-- pgTAP tests for public.account_deletion_request. Run with: supabase test db
begin;

select plan(11);

select has_table('public', 'account_deletion_request', 'account_deletion_request exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.account_deletion_request'::regclass),
  true,
  'RLS is enabled on account_deletion_request'
);

select col_hasnt_default(
  'public', 'account_deletion_request', 'confirmed_at',
  'confirmed_at has no default (on purpose)'
);

select table_privs_are(
  'public', 'account_deletion_request', 'anon', array['INSERT'],
  'anon only has INSERT on account_deletion_request'
);

set local role anon;

select lives_ok(
  $$ insert into public.account_deletion_request (email, confirmed_at)
     values ('delete-me@example.com', now()) $$,
  'anon can insert a confirmed deletion request'
);

select lives_ok(
  $$ insert into public.account_deletion_request (email, confirmed_at)
     values ('delete-me@example.com', now()) $$,
  'the same email can request deletion twice (no unique on purpose)'
);

select throws_ok(
  $$ insert into public.account_deletion_request (email)
     values ('unconfirmed@example.com') $$,
  '23502', null,
  'insert without confirmed_at fails (not null, no default)'
);

select throws_ok(
  $$ select * from public.account_deletion_request $$,
  '42501', null,
  'anon cannot SELECT from account_deletion_request'
);

select throws_ok(
  $$ delete from public.account_deletion_request $$,
  '42501', null,
  'anon cannot DELETE from account_deletion_request'
);

select throws_ok(
  $$ truncate public.account_deletion_request $$,
  '42501', null,
  'anon cannot TRUNCATE account_deletion_request'
);

reset role;

select is(
  (select count(*)::int from public.account_deletion_request where email = 'delete-me@example.com'),
  2,
  'both requests were stored'
);

select * from finish();
rollback;
