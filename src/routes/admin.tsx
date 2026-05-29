import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Phone, Calendar, StickyNote, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Panineria Bob Marley" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Reservation = {
  id: string;
  guest_name: string;
  phone: string;
  party_size: number;
  reserved_at: string;
  duration_minutes: number;
  notes: string | null;
  status: string;
  created_at: string;
  table_id: string;
};

type Table = { id: string; label: string; seats: number };

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!mounted) return;
      setUserEmail(session?.user.email ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!mounted) return;
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Avoid duplicate work on initial load (getSession already handles it)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") check(session);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userEmail) return <AuthForm />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-4xl uppercase">Accesso negato</h1>
          <p className="text-muted-foreground">
            L'account <span className="text-foreground">{userEmail}</span> non ha permessi di amministratore.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Esci
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard email={userEmail} />;
}

function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else toast.success("Account creato. Controlla la mail per confermare, poi richiedi l'accesso admin.");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card space-y-5">
        <div>
          <h1 className="font-display text-3xl uppercase">Area Ristoratore</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Accedi per gestire le prenotazioni." : "Registra un nuovo account admin."}
          </p>
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-input border border-border focus:border-primary outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-input border border-border focus:border-primary outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Entra" : "Registrati"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === "login" ? "Crea un account" : "Ho già un account"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "today" | "all">("upcoming");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [r, t] = await Promise.all([
      supabase.from("reservations").select("*").order("reserved_at", { ascending: true }),
      supabase.from("restaurant_tables").select("id,label,seats"),
    ]);
    if (r.data) setReservations(r.data as Reservation[]);
    if (t.data) setTables(t.data as Table[]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    load();
    const ch = supabase
      .channel("admin-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        if (active) load();
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const tableMap = Object.fromEntries(tables.map((t) => [t.id, t]));
  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

  const filtered = reservations.filter((r) => {
    const t = new Date(r.reserved_at).getTime();
    if (filter === "upcoming") return t >= now;
    if (filter === "today") return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    return true;
  });

  const todayCount = reservations.filter((r) => {
    const t = new Date(r.reserved_at).getTime();
    return t >= startOfDay.getTime() && t <= endOfDay.getTime();
  }).length;
  const todayCovers = reservations
    .filter((r) => {
      const t = new Date(r.reserved_at).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    })
    .reduce((sum, r) => sum + r.party_size, 0);

  async function cancel(id: string) {
    if (!confirm("Annullare questa prenotazione?")) return;
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Prenotazione annullata");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bob Marley · Admin</p>
            <h1 className="font-display text-xl uppercase leading-none">Prenotazioni</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Oggi" value={todayCount} />
          <Stat label="Coperti oggi" value={todayCovers} />
          <Stat label="Totali future" value={reservations.filter((r) => new Date(r.reserved_at).getTime() >= now).length} />
          <Stat label="Totali" value={reservations.length} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(["upcoming", "today", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 h-9 rounded-full text-xs uppercase tracking-widest border transition ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              {f === "upcoming" ? "Prossime" : f === "today" ? "Oggi" : "Tutte"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Nessuna prenotazione.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const table = tableMap[r.table_id];
              const dt = new Date(r.reserved_at);
              return (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display text-2xl uppercase">{r.guest_name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs uppercase tracking-widest">
                          {table?.label ?? "—"}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">
                          {r.status}
                        </span>
                      </div>
                      <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                        <Info icon={<Calendar className="h-4 w-4" />}>
                          {dt.toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}
                        </Info>
                        <Info icon={<Users className="h-4 w-4" />}>
                          {r.party_size} {r.party_size === 1 ? "persona" : "persone"} · {r.duration_minutes} min
                        </Info>
                        <Info icon={<Phone className="h-4 w-4" />}>
                          <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
                        </Info>
                        <Info icon={<StickyNote className="h-4 w-4" />}>
                          {r.notes || <span className="text-muted-foreground/60">— nessuna nota —</span>}
                        </Info>
                      </div>
                    </div>
                    <button
                      onClick={() => cancel(r.id)}
                      title="Annulla prenotazione"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Annulla
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
    </div>
  );
}

function Info({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-foreground">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="break-words">{children}</span>
    </div>
  );
}