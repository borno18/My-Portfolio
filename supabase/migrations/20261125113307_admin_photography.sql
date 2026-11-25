create table public.portfolio_photo_albums (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40)
);
create unique index portfolio_photo_albums_name on public.portfolio_photo_albums (lower(name));
alter table public.portfolio_photo_albums enable row level security;
revoke all on public.portfolio_photo_albums from anon, authenticated;
grant select, insert on public.portfolio_photo_albums to authenticated;
create policy "Owner with MFA manages albums" on public.portfolio_photo_albums for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role') = 'owner' and ((select auth.jwt()) ->> 'aal') = 'aal2');

alter table public.portfolio_photos
  add column album_id uuid references public.portfolio_photo_albums(id) on delete set null,
  add column visible boolean not null default true,
  add column featured boolean not null default false,
  add column tags text[] not null default '{}' check (cardinality(tags) <= 12);

insert into public.portfolio_photo_albums (name)
select distinct on (lower(btrim(category))) btrim(category)
from public.portfolio_photos
where btrim(category) <> ''
order by lower(btrim(category)), btrim(category);

update public.portfolio_photos p
set album_id = a.id
from public.portfolio_photo_albums a
where lower(btrim(p.category)) = lower(a.name);

alter policy "Read gallery" on public.portfolio_photos using (visible);

create function public.portfolio_reorder_photos(photo_ids uuid[])
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role', '') <> 'owner'
    or coalesce((select auth.jwt()) ->> 'aal', '') <> 'aal2' then
    return false;
  end if;
  lock table public.portfolio_photos in share row exclusive mode;
  if cardinality(photo_ids) > 1000 or cardinality(photo_ids) <> (select count(*) from public.portfolio_photos)
    or cardinality(photo_ids) <> (select count(*) from public.portfolio_photos where id = any(photo_ids)) then
    return false;
  end if;
  update public.portfolio_photos as p set display_order = (ordered.position - 1)::integer
  from unnest(photo_ids) with ordinality as ordered(id, position) where ordered.id = p.id;
  return true;
end;
$$;
revoke all on function public.portfolio_reorder_photos(uuid[]) from public, anon, authenticated;
grant execute on function public.portfolio_reorder_photos(uuid[]) to authenticated;
