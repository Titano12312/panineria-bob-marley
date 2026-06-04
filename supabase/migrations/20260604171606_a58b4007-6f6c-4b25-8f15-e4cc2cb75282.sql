
-- Fix 1: Remove reservations table from Realtime publication to prevent
-- PII (guest_name, phone, notes) being broadcast to authenticated subscribers,
-- bypassing the admin-only SELECT RLS policy.
ALTER PUBLICATION supabase_realtime DROP TABLE public.reservations;

-- Fix 2: Replace SECURITY DEFINER view with a SECURITY DEFINER function that
-- exposes only non-PII slot columns. The previous view ran with the creator's
-- privileges, bypassing RLS on reservations.
DROP VIEW IF EXISTS public.reservation_slots;

CREATE OR REPLACE FUNCTION public.get_reservation_slots()
RETURNS TABLE (
  id uuid,
  table_id uuid,
  reserved_at timestamptz,
  duration_minutes int,
  party_size int,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, table_id, reserved_at, duration_minutes, party_size, status
  FROM public.reservations
  WHERE status = 'confirmed'
    AND reserved_at >= now();
$$;

REVOKE ALL ON FUNCTION public.get_reservation_slots() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservation_slots() TO anon, authenticated;
