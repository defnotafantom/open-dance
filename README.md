# Open Dance

**Sito e applicazione gestionale per una scuola di danza.**

Il progetto riunisce corsi, iscrizioni, presenze, pagamenti registrati dallo staff e comunicazioni. Gli accessi sono distinti per segreteria, insegnanti e famiglie.

**Stato:** in sviluppo. L’anteprima online è ad accesso riservato; non è una demo pubblica aperta e non va presentata come prodotto commerciale ultimato.

[Guida alle funzioni](./docs/guida-funzionale.md) · [Portfolio CPHR](https://cphr.it/) · [Profilo di Daniele](https://github.com/defnotafantom)

## Contesto e contributo

Progetto di Daniele Bucca realizzato con l’assistenza di strumenti IA, a partire dalle esigenze di una scuola di danza. Il lavoro riguarda requisiti, interfacce e organizzazione delle funzioni; implementazione e verifiche sono assistite dall’IA.

## Tecnologie e struttura

| Ambito | Dove guardare |
| --- | --- |
| Pagine e interfacce · Next.js, React, TypeScript | [`src/app`](./src/app), [`src/components`](./src/components) |
| Autenticazione e gestione dei ruoli · Supabase | [`src/lib/auth`](./src/lib/auth), [`src/proxy.ts`](./src/proxy.ts) |
| Logica applicativa e validazione · Server Actions, Zod | [`src/lib`](./src/lib) |
| Schema e politiche di accesso · PostgreSQL | [`supabase/migrations`](./supabase/migrations) |
| Installazione PWA e notifiche · Serwist, Web Push | [`src/sw.ts`](./src/sw.ts), [`src/lib/push`](./src/lib/push) |

## Funzioni presenti

- Pagine pubbliche della scuola, corsi e insegnanti.
- Inviti allo staff, accessi per ruoli e gestione degli iscritti.
- Iscrizioni, liste d’attesa, calendario e registrazione delle presenze.
- Registrazione di importi e scadenze; nessun pagamento online viene promesso da questa descrizione.
- Avvisi, notifiche, documenti e richieste relative ai dati personali.

La [guida funzionale](./docs/guida-funzionale.md) descrive le aree nel dettaglio. L’uso reale richiede il collaudo dei ruoli e dei servizi configurati, oltre alla validazione delle procedure della scuola.

## Avvio in locale

Servono Node.js e un progetto Supabase dedicato allo sviluppo.

```bash
npm ci
cp .env.local.example .env.local
```

Configura le variabili Supabase del progetto di prova e `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Lo schema è versionato in `supabase/migrations`: applicalo al database di sviluppo con gli strumenti Supabase, mantenendo l’ordine delle migrazioni.

```bash
npm run dev
```

Le chiavi con privilegi di amministrazione restano sul server. Per provare documenti, pagamenti e famiglie usa dati inventati e servizi email di test.

## Controlli

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

La compilazione e il controllo dei tipi non sostituiscono le prove di accesso tra ruoli diversi. Prima dell’uso operativo vanno verificati iscrizioni, presenze, comunicazioni, accesso ai documenti, esportazione e cancellazione dei dati.

## Limiti attuali

L’accesso all’anteprima è riservato. Email, notifiche push e processi programmati dipendono dalle configurazioni esterne. Lo sviluppo deve avere un database separato dall’ambiente usato dalla scuola.

Il codice documenta un’applicazione in costruzione e non dichiara una conformità normativa o un collaudo completo su dati reali.

## Pubblicazione

I deploy automatici del ramo `master` sono sospesi mentre viene verificato l’ambiente operativo. Un aggiornamento del codice su GitHub non aggiorna da solo l’anteprima Vercel. La pipeline di qualità usa configurazioni di prova: non collauda un’istanza Supabase reale.
