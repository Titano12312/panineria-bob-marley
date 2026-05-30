import { createFileRoute } from "@tanstack/react-router";
import { Reservation } from "@/components/Reservation";
import heroPanino from "@/assets/hero-panino.jpg";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panineria Bob Marley — Panini gourmet a Palermo" },
      { name: "description", content: "Panini gourmet a Palermo, in Via Giuseppe Paratore 36. Prenota il tavolo in diretta dal sito." },
      { property: "og:title", content: "Panineria Bob Marley — Palermo" },
      { property: "og:description", content: "Panini gourmet a Palermo. Prenota il tavolo in diretta." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Story />
      <Menu />
      <section id="prenota" className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">In diretta</p>
            <h2 className="font-display text-5xl md:text-7xl uppercase">Prenota il tuo tavolo</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Scegli data, ora e tavolo dalla mappa. La disponibilità si aggiorna in tempo reale.
            </p>
          </div>
          <Reservation />
        </div>
      </section>
      <Visit />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-display text-xl uppercase tracking-widest">
          Bob <span className="text-reggae">Marley</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-muted-foreground">
          <a href="#storia" className="hover:text-foreground transition">Storia</a>
          <a href="#menu" className="hover:text-foreground transition">Menu</a>
          <a href="#visita" className="hover:text-foreground transition">Visita</a>
        </nav>
        <a href="#prenota" className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition">
          Prenota
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden pt-16">
      <img
        src={heroPanino}
        alt="Panino gourmet della Panineria Bob Marley"
        width={1600}
        height={1200}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="absolute inset-x-0 top-1/3 h-px bg-reggae opacity-60" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 md:pb-32 w-full">
        <p className="text-xs uppercase tracking-[0.4em] text-accent mb-6">Palermo · dal cuore</p>
        <h1 className="font-display text-6xl sm:text-7xl md:text-9xl uppercase leading-[0.85] max-w-4xl">
          Panineria<br/>
          <span className="text-reggae">Bob Marley</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Pane caldo, ingredienti veri, vibrazioni reggae.
          Una panineria di quartiere che mette pace tra fame e felicità.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#prenota" className="rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm uppercase tracking-widest font-semibold shadow-warm hover:opacity-90 transition">
            Prenota un tavolo
          </a>
          <a href="#menu" className="rounded-full border border-border px-8 py-3 text-sm uppercase tracking-widest hover:border-primary transition">
            Vedi il menu
          </a>
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="storia" className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12 items-start">
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">La nostra storia</p>
          <h2 className="font-display text-5xl md:text-6xl uppercase leading-[0.9]">
            One love,<br/>one panino.
          </h2>
        </div>
        <div className="md:col-span-3 space-y-4 text-lg text-muted-foreground">
          <p>
            Siamo in Via Giuseppe Paratore 36, a Palermo. Una bottega piccola con un'anima grande,
            dove la cucina siciliana incontra il ritmo lento della Giamaica.
          </p>
          <p>
            Pane lavorato a mano, salumi e formaggi scelti dai produttori locali,
            verdure di stagione. Ogni panino è una piccola jam session di sapori.
          </p>
          <div className="flex items-center gap-2 pt-4 text-foreground">
            <span className="text-3xl font-display">4.3</span>
            <span className="text-accent">★★★★★</span>
            <span className="text-sm text-muted-foreground">su Google</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const ITEMS = [
  { name: "Panino Bob Marley", desc: "Salsiccia, cipolla, salame piccante, emmental e funghi", price: "6,00" },
  { name: "Panino Cartoccio", desc: "Prosciutto e mozzarella", price: "3,50" },
  { name: "Panino Cartoccio Piccante", desc: "Prosciutto, mozzarella e salame piccante", price: "4,00" },
  { name: "Panino Cartopata", desc: "Prosciutto, mozzarella e patatine", price: "4,00" },
  { name: "Panino Topolino", desc: "Prosciutto, mozzarella e wurstel", price: "4,00" },
  { name: "Panino Wurstel", desc: "Wurstel e salsa a scelta", price: "3,00" },
];

function Menu() {
  return (
    <section id="menu" className="py-24 px-6 border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Il menu</p>
          <h2 className="font-display text-5xl md:text-7xl uppercase">Sei panini, zero compromessi</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {ITEMS.map((i) => (
            <div key={i.name} className="flex items-baseline gap-4 border-b border-border pb-6">
              <div className="flex-1">
                <h3 className="font-display text-2xl uppercase">{i.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{i.desc}</p>
              </div>
              <span className="font-display text-2xl text-accent">€{i.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section id="visita" className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Vieni a trovarci</p>
          <h2 className="font-display text-5xl md:text-6xl uppercase mb-8">Palermo,<br/>via Paratore.</h2>
          <ul className="space-y-5 text-lg">
            <li className="flex items-start gap-4">
              <MapPin className="h-5 w-5 mt-1 text-primary" />
              <span>Via Giuseppe Paratore, 36<br/><span className="text-muted-foreground text-base">90124 Palermo PA</span></span>
            </li>
            <li className="flex items-start gap-4">
              <Phone className="h-5 w-5 mt-1 text-primary" />
              <a href="tel:+393756165135" className="hover:text-primary transition">+39 375 616 5135</a>
            </li>
            <li className="flex items-start gap-4">
              <Clock className="h-5 w-5 mt-1 text-primary" />
              <span>Tutti i giorni · 10:30 – 22:00</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border shadow-card min-h-[320px]">
          <iframe
            title="Mappa Panineria Bob Marley"
            src="https://www.google.com/maps?q=Via+Giuseppe+Paratore+36+Palermo&output=embed"
            className="w-full h-full min-h-[320px] grayscale-[0.4] contrast-110"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="font-display uppercase tracking-widest text-foreground">Panineria Bob Marley</span>
        <span>© {new Date().getFullYear()} · Palermo, Sicilia</span>
        <a href="https://instagram.com" className="flex items-center gap-2 hover:text-foreground transition">
          <Instagram className="h-4 w-4" /> Instagram
        </a>
      </div>
      <div className="max-w-6xl mx-auto mt-6 text-center">
        <a href="/admin" className="text-[10px] uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition">
          Area riservata
        </a>
      </div>
    </footer>
  );
}
