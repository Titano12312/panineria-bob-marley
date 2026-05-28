
-- Restrict column access: public can only read non-sensitive availability columns
revoke select on public.reservations from anon, authenticated;
grant select (id, table_id, reserved_at, duration_minutes, party_size, status, created_at)
  on public.reservations to anon, authenticated;

-- Fix mutable search_path
create or replace function public.prevent_overlap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (
    select 1 from public.reservations r
    where r.table_id = new.table_id
      and r.status = 'confirmed'
      and r.id <> new.id
      and tstzrange(r.reserved_at, r.reserved_at + (r.duration_minutes || ' minutes')::interval)
          && tstzrange(new.reserved_at, new.reserved_at + (new.duration_minutes || ' minutes')::interval)
  ) then
    raise exception 'Questo tavolo è già prenotato in quella fascia oraria';
  end if;
  return new;
end $$;
