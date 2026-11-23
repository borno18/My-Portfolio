create table public.portfolio_posts (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) between 1 and 300),
  body text not null check (char_length(body) between 1 and 65000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  check (status <> 'published' or published_at is not null)
);

create table public.portfolio_photos (
  id uuid primary key,
  title text not null check (char_length(title) between 1 and 140),
  alt text not null check (char_length(alt) between 1 and 250),
  category text not null check (char_length(category) between 1 and 40),
  caption text not null default '' check (char_length(caption) <= 1000),
  public_id text not null unique check (public_id = 'portfolio/' || id::text),
  version bigint not null check (version > 0),
  cloud_name text not null check (cloud_name ~ '^[a-zA-Z0-9_-]+$'),
  width integer not null check (width between 1 and 2000),
  height integer not null check (height between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.portfolio_messages (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null check (char_length(fingerprint) = 64),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index portfolio_messages_throttle on public.portfolio_messages (fingerprint, created_at);

alter table public.portfolio_posts enable row level security;
alter table public.portfolio_photos enable row level security;
alter table public.portfolio_messages enable row level security;

revoke all on public.portfolio_posts, public.portfolio_photos, public.portfolio_messages from anon, authenticated;
grant select on public.portfolio_posts, public.portfolio_photos to anon, authenticated;
grant insert, update, delete on public.portfolio_posts, public.portfolio_photos to authenticated;
grant select, delete on public.portfolio_messages to authenticated;
grant select, insert on public.portfolio_messages to service_role;

create policy "Read published posts" on public.portfolio_posts for select to anon, authenticated
  using (status = 'published');
create policy "Read gallery" on public.portfolio_photos for select to anon, authenticated
  using (true);

create policy "Owner with MFA manages posts" on public.portfolio_posts for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');
create policy "Owner with MFA manages photos" on public.portfolio_photos for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');
create policy "Owner with MFA reads messages" on public.portfolio_messages for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');
create policy "Owner with MFA removes messages" on public.portfolio_messages for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');

create function public.portfolio_receive_message(sender_fingerprint text, sender_name text, sender_email text, sender_message text)
returns text language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(sender_fingerprint, 0));
  if exists (
    select 1 from public.portfolio_messages
    where fingerprint = sender_fingerprint and email = sender_email and message = sender_message
      and created_at > now() - interval '1 hour'
  ) then return 'received'; end if;

  if (select count(*) from public.portfolio_messages
      where fingerprint = sender_fingerprint and created_at > now() - interval '1 hour') >= 5
  then return 'limited'; end if;

  insert into public.portfolio_messages(fingerprint, name, email, message)
  values(sender_fingerprint, sender_name, sender_email, sender_message);
  return 'received';
end;
$$;

revoke execute on function public.portfolio_receive_message(text,text,text,text) from public, anon, authenticated;
grant execute on function public.portfolio_receive_message(text,text,text,text) to service_role;
