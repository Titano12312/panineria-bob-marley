-- Attach overlap-prevention trigger
DROP TRIGGER IF EXISTS prevent_overlap_trigger ON public.reservations;
CREATE TRIGGER prevent_overlap_trigger
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.prevent_overlap();

-- Enable realtime for reservations
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;