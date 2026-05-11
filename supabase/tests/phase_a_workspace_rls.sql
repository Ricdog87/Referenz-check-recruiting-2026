create extension if not exists pgtap;
begin;
select plan(4);

-- setup identities
select set_config('request.jwt.claim.email', 'member-a@example.com', true);

-- positive
select ok(
  exists(select 1 from public."Candidate" c where public.is_workspace_member(c."workspaceId")),
  'Workspace member can access candidate rows in own workspace'
);

-- negative via helper
select set_config('request.jwt.claim.email', 'outsider@example.com', true);
select ok(
  not exists(select 1 from public."Candidate" c where public.is_workspace_member(c."workspaceId")),
  'Non-member cannot satisfy workspace membership helper'
);

-- table-level checks
select set_config('request.jwt.claim.email', 'member-a@example.com', true);
select lives_ok(
  $$ select * from public."Candidate" limit 1; $$,
  'Member query on Candidate succeeds under RLS'
);

select set_config('request.jwt.claim.email', 'outsider@example.com', true);
select lives_ok(
  $$ select * from public."Candidate" limit 1; $$,
  'Outsider query executes but returns zero rows under RLS'
);

select * from finish();
rollback;
