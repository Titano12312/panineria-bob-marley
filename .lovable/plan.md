## Problema

Le richieste a `reservations` e `reservation_slots` falliscono con HTTP 403:
```
permission denied for function has_role
```

Le RLS policy di `reservations` chiamano `public.has_role(auth.uid(), 'admin')`. In una migration recente è stato fatto un `REVOKE` di `has_role` da `PUBLIC`/`anon`/`authenticated`, ma PostgREST valuta le policy con il ruolo del chiamante: senza EXECUTE la valutazione fallisce e l'intera SELECT viene rifiutata. Risultato: la mappa tavoli non riesce a leggere gli slot e l'admin non vede prenotazioni.

## Fix (1 migration, nessuna modifica al codice)

Ridare EXECUTE sulla funzione `has_role` ai ruoli che eseguono le policy:

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
```

`has_role` è `SECURITY DEFINER` con `search_path = public` e legge solo `user_roles` confrontando `user_id` e `role`: è sicuro esporlo per EXECUTE — è esattamente il pattern raccomandato per evitare ricorsione RLS.

## Verifica

Dopo la migration:
- la home ricarica gli slot senza 403,
- i tavoli già prenotati appaiono come "Occupato",
- `/admin` torna a listare le prenotazioni.