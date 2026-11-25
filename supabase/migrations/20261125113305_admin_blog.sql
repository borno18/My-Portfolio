alter table public.portfolio_posts
  drop constraint portfolio_posts_status_check,
  add constraint portfolio_posts_status_check check (status in ('draft', 'published', 'archived')),
  add column featured boolean not null default false,
  add column updated_at timestamptz;

alter policy "Read published posts" on public.portfolio_posts
  using (status = 'published' and published_at <= now());
