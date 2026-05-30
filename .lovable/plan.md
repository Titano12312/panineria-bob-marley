## Obiettivo
Capire perché il sito va in 404 dopo un deploy riuscito su Netlify, Cloudflare o Vercel e preparare la correzione giusta.

## Piano
1. Verificare l’output di build reale del progetto per confermare se genera un’app statica oppure un output con runtime server.
2. Allineare la strategia di deploy al tipo di app:
   - se è compatibile con hosting statico, sistemare la configurazione corretta per la piattaforma scelta;
   - se richiede runtime server, rimuovere la falsa configurazione “SPA-only” e preparare il deploy nel modo corretto.
3. Correggere i file di configurazione del deploy per la piattaforma target, evitando rewrite generici che non risolvono un’app SSR.
4. Validare il comportamento finale su route principale e refresh pagina per escludere nuovi 404.

## Diagnosi probabile
Dai file letti, il progetto usa **TanStack Start** con una **entry server** (`src/server.ts`) e configurazione `tanstackStart` in `vite.config.ts`.
Questo fa pensare che **non sia una semplice SPA statica con solo `index.html`**.
Quindi:
- `public/_redirects`
- `vercel.json` con rewrite verso `/index.html`

possono aiutare solo una SPA statica, ma **non correggono un’app che richiede runtime server/SSR**. Per questo il deploy può risultare “success” ma poi l’apertura del sito dare 404 o routing rotto su host statici configurati nel modo sbagliato.

## Dettagli tecnici
- `@lovable.dev/vite-tanstack-config`
- `tanstackStart.server.entry = "server"`
- `src/server.ts` importa `@tanstack/react-start/server-entry`

Questi segnali indicano che il progetto è pensato per il runtime del framework, non per essere pubblicato come semplice cartella statica con fallback a `index.html`.

## Esito atteso dopo l’implementazione
Avrai una di queste due soluzioni corrette:
- deploy funzionante sulla piattaforma esterna scelta, con configurazione coerente col runtime del progetto;
- oppure pubblicazione tramite l’hosting nativo del progetto, evitando il 404 strutturale sugli host statici esterni.