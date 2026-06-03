-- Switch the reservation_slots view to run with the view owner's rights so
-- anon/authenticated can read non-sensitive availability data without needing
-- a public SELECT policy on the underlying reservations table.
ALTER VIEW public.reservation_slots SET (security_invoker = false);

-- Grant access to the safe view (no PII).
GRANT SELECT ON public.reservation_slots TO anon, authenticated;

-- Remove the policy that exposed guest_name and phone publicly.
DROP POLICY IF EXISTS reservations_public_read ON public.reservations;
