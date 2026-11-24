alter table public.portfolio_posts
  add column cover_path text,
  add column cover_alt text not null default '',
  add constraint portfolio_posts_cover_path check (
    cover_path is null or cover_path ~ ('^' || slug || '/[0-9a-f-]{36}[.]jpg$')
  ),
  add constraint portfolio_posts_cover_alt check (
    char_length(cover_alt) <= 250 and (cover_path is null or btrim(cover_alt) <> '')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-covers', 'article-covers', false, 3500000, array['image/jpeg']);

create policy "MFA owner manages article covers" on storage.objects for all to authenticated
  using (bucket_id = 'article-covers' and (select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role' = 'owner' and (select auth.jwt()) ->> 'aal' = 'aal2')
  with check (bucket_id = 'article-covers' and (select auth.jwt()) -> 'app_metadata' ->> 'portfolio_role' = 'owner' and (select auth.jwt()) ->> 'aal' = 'aal2');

create policy "Public reads published article covers" on storage.objects for select to anon, authenticated
  using (bucket_id = 'article-covers' and exists (
    select 1 from public.portfolio_posts p where p.cover_path = storage.objects.name and p.status = 'published'
  ));

create index portfolio_posts_cover_path_idx on public.portfolio_posts (cover_path) where cover_path is not null;
