alter table public.portfolio_photos
  add column bundled_key text unique,
  alter column public_id drop not null,
  alter column cloud_name drop not null,
  alter column version drop not null,
  alter column width drop not null,
  alter column height drop not null,
  drop constraint portfolio_photos_check,
  add constraint portfolio_photos_media_check check (
    (
      public_id is not null and public_id ~ '^portfolio/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and cloud_name is not null and version is not null and width is not null and height is not null
    ) or (
      bundled_key is not null and public_id is null and cloud_name is null
      and version is null and width is null and height is null
    )
  );

insert into public.portfolio_photos (id, bundled_key, title, alt, category, caption, display_order)
values
  (gen_random_uuid(), 'durga-puja-sylhet', 'Durga Puja Sylhet', 'Crowds beneath purple lights at Durga Puja in Sylhet', 'Festival', 'Sylhet, Bangladesh', 995),
  (gen_random_uuid(), 'devi-durga', 'Devi Durga', 'A richly decorated statue of Devi Durga', 'Festival', 'Sylhet, Bangladesh', 996),
  (gen_random_uuid(), 'iict-sust', 'IICT SUST', 'A covered stairway between campus buildings', 'Architecture', 'SUST, Sylhet', 997),
  (gen_random_uuid(), 'home-kitchen', 'Home Kitchen', 'A plate of rice and home-cooked dishes', 'Food', 'Home', 998),
  (gen_random_uuid(), 'a-dream-afternoon', 'A Dream Afternoon', 'A balcony and plants in the late afternoon sun in Sylhet', 'Street', 'Sylhet', 999);
