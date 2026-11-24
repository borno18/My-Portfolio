alter table portfolio_private.inbox_key
  add column production_digest bytea check (octet_length(production_digest) = 32);

create or replace function public.portfolio_receive_message(
  delivery_key text, sender_fingerprint text, sender_name text, sender_email text, sender_message text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  key_digest bytea;
begin
  if delivery_key is null or char_length(delivery_key) <> 64 then
    raise exception 'Inbox delivery unauthorized' using errcode = '42501';
  end if;

  key_digest := pg_catalog.sha256(pg_catalog.convert_to(delivery_key, 'UTF8'));
  if not exists (
    select 1 from portfolio_private.inbox_key
    where key_digest in (digest, production_digest)
  ) then
    raise exception 'Inbox delivery unauthorized' using errcode = '42501';
  end if;
  return public.portfolio_receive_message(sender_fingerprint, sender_name, sender_email, sender_message);
end;
$$;
