-- Apply after schema.sql, before enabling the webhook. No customer data changed.
create table if not exists public.telegram_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);
alter table public.telegram_updates enable row level security;
revoke all on public.telegram_updates from public, anon, authenticated;
grant select, insert, delete on public.telegram_updates to service_role;
-- Only update IDs are stored, never message contents. For long-running sites,
-- retain IDs at least 7 days; Telegram retries must not trigger duplicate replies.
