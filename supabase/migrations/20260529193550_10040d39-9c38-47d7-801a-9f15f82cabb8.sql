ALTER TABLE public.reservations
ALTER COLUMN duration_minutes SET DEFAULT 60;

CREATE OR REPLACE FUNCTION public.prevent_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.table_id = NEW.table_id
      AND r.status = 'confirmed'
      AND r.id <> NEW.id
      AND tstzrange(r.reserved_at, r.reserved_at + make_interval(mins => r.duration_minutes), '[)')
          && tstzrange(NEW.reserved_at, NEW.reserved_at + make_interval(mins => NEW.duration_minutes), '[)')
  ) THEN
    RAISE EXCEPTION 'Questo tavolo è già prenotato in quella fascia oraria';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_no_overlap ON public.reservations;
DROP TRIGGER IF EXISTS prevent_overlap_trigger ON public.reservations;
CREATE TRIGGER prevent_overlap_trigger
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_overlap();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservations'
      AND policyname = 'reservations_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY reservations_public_read
      ON public.reservations
      FOR SELECT
      TO anon, authenticated
      USING (status = 'confirmed')
    $policy$;
  END IF;
END $$;