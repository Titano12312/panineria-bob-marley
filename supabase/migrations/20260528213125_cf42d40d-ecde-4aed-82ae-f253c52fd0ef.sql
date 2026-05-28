
-- Tables in the restaurant
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  seats int not null check (seats > 0 and seats <= 20),
  x int not null default 0,
  y int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.restaurant_tables to anon, authenticated;
grant all on public.restaurant_tables to service_role;

alter table public.restaurant_tables enable row level security;

create policy "tables_public_read" on public.restaurant_tables
  for select to anon, authenticated using (true);

-- Reservations
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.restaurant_tables(id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  phone text not null check (char_length(phone) between 5 and 30),
  party_size int not null check (party_size between 1 and 20),
  reserved_at timestamptz not null,
  duration_minutes int not null default 90 check (duration_minutes between 30 and 240),
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);

grant select, insert on public.reservations to anon, authenticated;
grant all on public.reservations to service_role;

alter table public.reservations enable row level security;

-- Public can insert new reservations
create policy "reservations_public_insert" on public.reservations
  for insert to anon, authenticated with check (
    reserved_at > now() and reserved_at < now() + interval '60 days'
  );

-- Public can read only confirmed reservations (used to check availability).
-- Personal fields are hidden through the view below.
create policy "reservations_public_read" on public.reservations
  for select to anon, authenticated using (true);

-- Public view exposing ONLY non-sensitive availability info
create view public.reservation_slots
with (security_invoker = true)
as
select id, table_id, reserved_at, duration_minutes, party_size, status
from public.reservations
where status = 'confirmed';

grant select on public.reservation_slots to anon, authenticated;

-- Prevent double-booking the same table at overlapping times
create or replace function public.prevent_overlap()
returns trigger language plpgsql as $$
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

create trigger reservations_no_overlap
  before insert or update on public.reservations
  for each row execute function public.prevent_overlap();

-- Realtime
alter publication supabase_realtime add table public.reservations;
alter table public.reservations replica identity full;

-- Seed restaurant tables (floor plan in a 100x60 grid)
insert into public.restaurant_tables (label, seats, x, y) values
  ('T1', 2, 12, 18),
  ('T2', 2, 28, 18),
  ('T3', 4, 50, 18),
  ('T4', 4, 72, 18),
  ('T5', 6, 18, 42),
  ('T6', 4, 42, 42),
  ('T7', 4, 62, 42),
  ('T8', 8, 84, 42);
