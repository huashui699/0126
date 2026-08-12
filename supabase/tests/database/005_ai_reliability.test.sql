begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

select has_table('public', 'ai_processing_jobs', 'AI processing jobs table exists');
select has_table('public', 'source_citations', 'citation graph exists');
select has_table('public', 'reliability_assessments', 'reliability assessment ledger exists');
select has_table('public', 'review_actions', 'review action ledger exists');
select has_table('public', 'trust_status_history', 'trust status history exists');
select has_view('public', 'ai_cost_summary_daily', 'AI cost report exists');

select has_column('public', 'ai_processing_jobs', 'raw_item_id', 'AI job traces to raw input');
select has_column('public', 'ai_processing_jobs', 'news_id', 'AI job traces to news candidate');
select has_column('public', 'ai_processing_jobs', 'idempotency_key', 'AI job is idempotent');
select has_column('public', 'ai_processing_jobs', 'status', 'AI job records status');
select has_column('public', 'ai_processing_jobs', 'attempt', 'AI job records retry attempt');
select has_column('public', 'ai_processing_jobs', 'model_id', 'AI job records model ID');
select has_column('public', 'ai_processing_jobs', 'staged_output', 'AI output is staged before publication');
select has_column('public', 'ai_processing_jobs', 'estimated_cost_usd', 'AI job records estimated cost');
select has_column('public', 'ai_processing_jobs', 'error_code', 'AI job records stable errors');

select has_column('public', 'news', 'original_language', 'news records source language');
select has_column('public', 'news', 'translated_title', 'news records translated title');
select has_column('public', 'news', 'translated_summary', 'news records translated summary');
select has_column('public', 'news', 'ai_processing_version', 'news records processing version');
select has_column('public', 'news', 'review_state', 'news records review queue state');
select has_column('public', 'news', 'hidden_at', 'news supports reversible hiding');
select has_column('public', 'news', 'direct_official_assertion', 'direct official assertion is explicit');
select has_column('public', 'event_clusters', 'merged_into_id', 'event merge is logical and reversible');

select has_column('public', 'event_clusters', 'fingerprint', 'event clusters store fingerprint');
select has_column('public', 'event_clusters', 'cluster_method', 'event clusters store explainable method');
select has_column('public', 'event_clusters', 'cluster_explanation', 'event clusters store explanation');

select results_eq(
  $$ select count(*)::bigint from pg_class where oid in (
    'public.ai_processing_jobs'::regclass, 'public.source_citations'::regclass,
    'public.reliability_assessments'::regclass, 'public.review_actions'::regclass,
    'public.trust_status_history'::regclass
  ) and relrowsecurity $$,
  $$ values (5::bigint) $$,
  'RLS is enabled on all internal AI and reliability tables'
);

select ok(not has_table_privilege('anon', 'public.ai_processing_jobs', 'select'), 'anonymous cannot inspect AI jobs');
select ok(not has_table_privilege('authenticated', 'public.review_actions', 'select'), 'authenticated clients cannot inspect operator identities');
select ok(not has_table_privilege('anon', 'public.source_citations', 'select'), 'anonymous cannot inspect internal citation graph');
select ok(has_table_privilege('service_role', 'public.ai_processing_jobs', 'insert'), 'service role can enqueue AI jobs');
select ok(has_table_privilege('service_role', 'public.review_actions', 'insert'), 'service role can record reviews');
select ok(has_table_privilege('service_role', 'public.ai_cost_summary_daily', 'select'), 'service role can read AI cost report');

select has_function('public', 'finalize_ai_processing_job', array['uuid','jsonb','text','text','text','integer','integer','numeric'], 'atomic AI finalizer exists');
select has_function('public', 'apply_review_action', array['text','text','text','uuid','text','uuid','uuid'], 'atomic review action exists');
select has_function('public', 'revert_review_action', array['uuid','text','text'], 'review reversal exists');
select has_function('public', 'record_reliability_assessment', array['uuid','text','text[]','text','jsonb','text','smallint','boolean'], 'reliability recorder exists');
select ok(not has_function_privilege('anon', 'public.apply_review_action(text,text,text,uuid,text,uuid,uuid)', 'execute'), 'anonymous cannot apply reviews');
select ok(not has_function_privilege('anon', 'public.revert_review_action(uuid,text,text)', 'execute'), 'anonymous cannot revert reviews');
select has_view('public', 'news_trust_history_public', 'sanitized public status history view exists');
select has_function('private', 'enforce_confirmed_news_source_gate', array[]::text[], 'database-wide green hard gate exists');
select has_function('private', 'downgrade_confirmed_news_after_source_revocation', array[]::text[], 'source revocation downgrade function exists');
select has_trigger('public', 'news', 'enforce_confirmed_news_source_gate', 'all news writes enforce the green hard gate');
select has_trigger('public', 'sources', 'downgrade_confirmed_news_after_source_revocation', 'source revocation downgrades affected green news');

select * from finish();
rollback;
