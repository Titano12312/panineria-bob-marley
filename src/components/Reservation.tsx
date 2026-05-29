import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Users, Clock, Phone, User, CheckCircle2 } from "lucide-react";

type Table = {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
};

type Slot = {
  id: string;
  table_id: string;
  reserved_at: string;
  duration_minutes: number;
  party_size: number;
  status: string;
};

const HOURS = ["12:00", "12:30", "13:00", "13:30", "19:30", "20:00", "20:30", "21:00", "21:30"];

const schema = z.object({
  guest_name: z.string().trim().min(2, "Nome troppo corto").max(80),
  phone: z.string().trim().min(5, "Telefono non valido").max(30).regex(/^[0-9+\s().-]+$/, "Caratteri non validi"),
  party_size: z.number().int().min(1).max(20),
  notes: z.string().max(500).optional(),
});

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isOverlap(slot: Slot, start: Date, durationMin: number) {
  const s1 = new Date(slot.reserved_at).getTime();
  const e1 = s1 + slot.duration_minutes * 60_000;
  const s2 = start.getTime();
  const e2 = s2 + durationMin * 60_000;
  return s1 < e2 && s2 < e1;
}

export function Reservation() {
  const [tables, setTables] = useState<Table[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("20:00");
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // Initial load + realtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [t, s] = await Promise.all([
        supabase.from("restaurant_tables").select("*").order("label"),
        supabase.from("reservation_slots").select("*").gte("reserved_at", new Date().toISOString()),
      ]);
      if (!mounted) return;
      if (t.data) setTables(t.data as Table[]);
      if (s.data) setSlots(s.data as Slot[]);
    })();

    const channel = supabase
      .channel("reservations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        async () => {
          const { data } = await supabase
            .from("reservation_slots")
            .select("*")
            .gte("reserved_at", new Date().toISOString());
          if (data) setSlots(data as Slot[]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedDateTime = useMemo(() => {
    const dt = new Date(`${date}T${time}:00`);
    return dt;
  }, [date, time]);

  const availability = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const t of tables) {
      const busy = slots.some(
        (s) => s.table_id === t.id && isOverlap(s, selectedDateTime, 90)
      );
      map[t.id] = !busy && t.seats >= partySize;
    }
    return map;
  }, [tables, slots, selectedDateTime, partySize]);

  const liveCount = useMemo(
    () => slots.filter((s) => new Date(s.reserved_at).toDateString() === selectedDateTime.toDateString()).length,
    [slots, selectedDateTime]
  );

  async function submit() {
    if (!tableId) {
      toast.error("Seleziona un tavolo dalla mappa");
      return;
    }
    const parsed = schema.safeParse({
      guest_name: guestName,
      phone,
      party_size: partySize,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    if (selectedDateTime.getTime() < Date.now()) {
      toast.error("Scegli un orario futuro");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("reservations")
      .insert({
        table_id: tableId,
        guest_name: parsed.data.guest_name,
        phone: parsed.data.phone,
        party_size: parsed.data.party_size,
        reserved_at: selectedDateTime.toISOString(),
        duration_minutes: 90,
        notes: parsed.data.notes ?? null,
      });
    setSubmitting(false);

    if (error) {
      toast.error(error.message.includes("già prenotato")
        ? "Tavolo appena prenotato da qualcun altro 😬 Scegline un altro."
        : "Errore nella prenotazione. Riprova.");
      return;
    }

    // Refresh availability immediately (anon can't receive realtime on reservations)
    const { data: fresh } = await supabase
      .from("reservation_slots")
      .select("*")
      .gte("reserved_at", new Date().toISOString());
    if (fresh) setSlots(fresh as Slot[]);

    setConfirmedId("ok");
    toast.success("Prenotazione confermata! Ti aspettiamo 🌴");
    setGuestName("");
    setPhone("");
    setNotes("");
    setTableId(null);
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* Floor plan */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-3xl uppercase">La sala</h3>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            Live · {liveCount} oggi
          </span>
        </div>

        <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="absolute inset-0 grain opacity-20 pointer-events-none" />
          <svg viewBox="0 0 100 60" className="w-full h-auto block">
            {/* Floor */}
            <rect x="0" y="0" width="100" height="60" fill="oklch(0.22 0.03 55)" />
            {/* Entrance */}
            <rect x="46" y="56" width="8" height="4" fill="oklch(0.72 0.18 50)" rx="0.5" />
            <text x="50" y="59.3" textAnchor="middle" fontSize="2" fill="oklch(0.18 0.025 60)" fontFamily="Anton">
              ENTRATA
            </text>
            {/* Bar */}
            <rect x="4" y="3" width="92" height="5" fill="oklch(0.28 0.03 60)" rx="0.5" />
            <text x="50" y="6.5" textAnchor="middle" fontSize="2.2" fill="oklch(0.82 0.16 90)" fontFamily="Anton" letterSpacing="0.2">
              BANCONE
            </text>

            {tables.map((t) => {
              const free = availability[t.id];
              const selected = tableId === t.id;
              const radius = 3 + Math.min(t.seats, 8) * 0.4;
              return (
                <g
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => free && setTableId(t.id)}
                  style={{ opacity: free ? 1 : 0.45 }}
                >
                  <circle
                    cx={t.x}
                    cy={t.y}
                    r={radius}
                    fill={selected ? "oklch(0.72 0.18 50)" : free ? "oklch(0.55 0.15 145)" : "oklch(0.4 0.02 60)"}
                    stroke={selected ? "oklch(0.82 0.16 90)" : "oklch(0.32 0.03 60)"}
                    strokeWidth={selected ? 0.6 : 0.2}
                  >
                    {free && !selected && (
                      <animate attributeName="r" values={`${radius};${radius + 0.3};${radius}`} dur="2.4s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <text x={t.x} y={t.y + 0.8} textAnchor="middle" fontSize="2.2" fill="oklch(0.98 0.02 85)" fontFamily="Anton">
                    {t.label}
                  </text>
                  <text x={t.x} y={t.y + radius + 2.5} textAnchor="middle" fontSize="1.6" fill="oklch(0.72 0.03 80)">
                    {t.seats} posti
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary" /> Libero</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Selezionato</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-muted" /> Occupato</span>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 shadow-card">
          {confirmedId ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto h-14 w-14 text-secondary mb-4" />
              <h3 className="font-display text-3xl uppercase mb-2">Confermato!</h3>
              <p className="text-muted-foreground mb-6">
                Ti aspettiamo {selectedDateTime.toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" })}.
              </p>
              <button
                onClick={() => setConfirmedId(null)}
                className="text-sm uppercase tracking-widest text-primary hover:underline"
              >
                Nuova prenotazione
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="font-display text-3xl uppercase">Prenota</h3>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    min={todayISO()}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Orario">
                  <select value={time} onChange={(e) => setTime(e.target.value)} className="input">
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Persone" icon={<Users className="h-4 w-4" />}>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPartySize(n)}
                      className={`h-10 w-10 rounded-full border text-sm transition ${
                        partySize === n
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Nome" icon={<User className="h-4 w-4" />}>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Il tuo nome"
                  maxLength={80}
                  className="input"
                />
              </Field>

              <Field label="Telefono" icon={<Phone className="h-4 w-4" />}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 ..."
                  maxLength={30}
                  className="input"
                />
              </Field>

              <Field label="Note">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergie, occasioni speciali..."
                  maxLength={500}
                  rows={2}
                  className="input resize-none"
                />
              </Field>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Tavolo: <span className="text-foreground font-semibold">
                  {tableId ? tables.find((t) => t.id === tableId)?.label : "scegli dalla mappa"}
                </span>
              </div>

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-display text-lg uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-warm"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Prenota ora
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          height: 2.5rem;
          padding: 0 0.75rem;
          border-radius: 0.5rem;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          font-family: var(--font-body);
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: var(--color-primary); }
        textarea.input { height: auto; padding: 0.625rem 0.75rem; }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {icon}{label}
      </span>
      {children}
    </label>
  );
}