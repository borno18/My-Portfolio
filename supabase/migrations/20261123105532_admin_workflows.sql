alter table public.portfolio_photos
  add column display_order integer not null default 0 check (display_order between 0 and 999);
alter table public.portfolio_messages
  add column read_at timestamptz;

grant update (read_at) on public.portfolio_messages to authenticated;
create policy "Owner with MFA marks messages" on public.portfolio_messages for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');

create table public.portfolio_project_settings (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  featured boolean not null,
  display_order integer not null check (display_order between 0 and 999)
);
alter table public.portfolio_project_settings enable row level security;
revoke all on public.portfolio_project_settings from anon, authenticated;
grant select on public.portfolio_project_settings to anon, authenticated;
grant insert, update on public.portfolio_project_settings to authenticated;

create policy "Read project display settings" on public.portfolio_project_settings for select to anon, authenticated
  using (true);
create policy "Owner with MFA manages project display" on public.portfolio_project_settings for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');
