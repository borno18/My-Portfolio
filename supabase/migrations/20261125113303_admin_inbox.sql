alter table public.portfolio_messages
  add column starred boolean not null default false,
  add column search_text text generated always as (name || ' ' || email || ' ' || message) stored;

grant update (starred) on public.portfolio_messages to authenticated;
