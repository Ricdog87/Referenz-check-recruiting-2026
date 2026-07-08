# Partner-/Reseller-Programm

Co-Branded Reseller-Modell für Personaldienstleister (PDL).
candiq stellt die Plattform, der Partner verkauft unter eigener Marke
weiter — das candiq-Siegel „verifiziert durch candiq" bleibt sichtbarer
Pflichtbestandteil.

> **Status:** Phase 0 abgeschlossen (Bestandsaufnahme + Entscheidungen).
> Phase 1 (Datenmodell) folgt nach Freigabe.
> Feature-Flag `PARTNER_PROGRAM_ENABLED` (Default `false`) gatet alle Routen.

---

## Architektur (Sollzustand)

```
                            ┌──────────────────────────────┐
   Öffentliche Landing      │  /partner                    │
   (KEINE EK-Preise)        │  /partner/register           │
                            └─────────────┬────────────────┘
                                          │ NextAuth
                                          │ (User.role = 'PARTNER')
                                          ▼
   Reseller-Dashboard        ┌──────────────────────────────┐
   (nur approved Partner)    │  /partner/dashboard          │
                            │  /partner/dashboard/customers│
                            │  /partner/dashboard/pricing  │
                            │  /partner/dashboard/co-brand │
                            └─────────────┬────────────────┘
                                          │ Server-only Reads
                                          ▼
   Datenmodell               ┌──────────────────────────────┐
   (Prisma + Postgres,       │  Partner            (1:1 User)│
    App-Layer-Guards)        │  PartnerPricing  (planKey,id) │
                            │  PartnerTier                  │
                            │  PartnerCustomer (Mandant)    │
                            └──────────────────────────────┘
                                          │
                                          ▼
   Admin-Approval            ┌──────────────────────────────┐
                            │  /admin/partners              │
                            │  Status PENDING → APPROVED    │
                            └──────────────────────────────┘
```

## Modell-Entscheidungen (festgezurrt)

| Entscheidung | Wahl | Begründung |
|---|---|---|
| **Auth** | Separates `PartnerAccount` + eigener NextAuth-Handler (`/api/auth/partner/*`, eigener Cookie) | Harte Domain-Grenze: Partner fasst NIE Kandidaten-/Consent-/CLIENT-Daten an |
| **EK-Preise** | DB-Tabelle `PartnerPricing` pro Plan × Partner | Admin-editierbar, auditierbar, pro Deal verhandelbar |
| **Tier-Schwellen** | Registered 0 / Silver 5 / Gold 15 / Platinum 30 aktive Kunden | Realistisch für DACH-PDL-Markt; in `PartnerTier` editierbar |
| **Isolation** | App-Layer-Guards (`withPartnerScope`) + Vitest, kein RLS | Konsistent mit bestehendem candiq-Pattern (Prisma als Owner) |
| **Session-Frische** | JWT-Status/Tier-Refresh alle 60 s aus der DB | Suspend wirkt sofort; frisch Approvte kommen ohne Re-Login aus /partner/pending |
| **Referral-Bindung** | `?via=`-Vorteile nur für die Mail-Empfänger-Adresse; Prefill nach Conversion gesperrt | Verhindert Link-Weitergabe → beliebige AGENCY-Konten |

## Einheiten-Semantik (verbindlich!)

**Alle Cent-Beträge im Partner-Modell sind MONATSRATEN** — in
`PartnerPricing.list/baseEk*Cents` genauso wie in
`PartnerCustomer.ek/end/marginCents`:

- `*MonthlyCents` = Monatsrate bei monatlicher Zahlweise
- `*AnnualCents` = **günstigere Monatsrate bei jährlicher Zahlweise** —
  NICHT die Jahressumme! (spiegelt `Plan.priceAnnual` aus `lib/utils.ts`,
  dort ebenfalls „€/Mo.")
- Konsumenten dürfen **niemals ×12 oder ÷12** rechnen, um „Monatswerte"
  zu erhalten — die Werte SIND Monatswerte. Margen-Summen
  (Dashboard-KPI, Payouts, Admin-MRR) sind damit direkt Monats-Margen.

## Bewusste Ops-/Security-Entscheidungen

- **`vercel.json` buildCommand macht `prisma db push` gegen die Prod-DB
  bei jedem Deploy.** Bestands-Pattern des Repos (kein Migrations-Baseline
  in Prod). Bekannte Schuld: Schema-Änderungen wirken ungate-t beim Deploy.
  Umstellung auf `migrate deploy` erfordert Baseline-Resolve — separat planen.
- **E-Mail-Enumeration bei `/api/partner/register` (409 bei existierender
  Adresse)**: bewusst konsistent mit dem HR-Signup; Trade-off UX > Anonymität
  bei einem B2B-Bewerbungsformular mit Rate-Limit 3/h.
- **Alle transaktionalen Mails werden AWAITED versendet** (kein
  fire-and-forget) — Vercel friert Lambdas nach dem Response-Return ein,
  nicht-awaitete Promises gehen verloren.

## Gating (kritisch)

EK-Preise dürfen **nie** im Client-Bundle landen. Drei Schutzschichten:

1. **Server-Component-Only**: `lib/partner/pricing.ts` exportiert
   ausschließlich `async`-Funktionen, die in Server Components oder
   API-Routen aufgerufen werden. Kein `'use client'`-Import.
2. **Approval-Gate**: `requireApprovedPartner(session)` aus
   `lib/partner/gate.ts` wirft, wenn Partner nicht `APPROVED` ist.
   Layout-Level enforced.
3. **Test-Beweis**: `__tests__/partner-gating.test.ts` ruft die Routes
   anonym und mit `PENDING`-Partner auf und erwartet 401/403 sowie
   leeres HTML ohne EK-Strings.

## Lokales Setup (Supabase)

candiq nutzt **Supabase Postgres** (EU-Region). `.env` braucht beide URLs:
`DATABASE_URL` (Pooler, Port 6543) für Runtime, `DIRECT_URL` (Port 5432) für
Prisma-Migrations. Siehe `.env.example`.

```bash
# 1. Branch & Flag aktivieren
git checkout feat/partner-program
echo 'PARTNER_PROGRAM_ENABLED="true"' >> .env

# 2. Schema-Sync auf Supabase
#    Variante A — über Prisma (lokal, mit eigenen DIRECT_URL/DATABASE_URL):
npm install
DATABASE_URL=$SUPABASE_DATABASE_URL DIRECT_URL=$SUPABASE_DIRECT_URL \
  npx prisma migrate deploy            # spielt prisma/migrations/* sauber ab

#    Variante B — Migration via Supabase CLI:
supabase db push --include-all          # spielt alle prisma/migrations/* an

#    Variante C — Migration via Supabase MCP (für AI-Assistant):
#    apply_migration(name='partner_program_phase1', query=<SQL aus migration.sql>)

# 3. Seeds (Prisma-Client; brauchen DATABASE_URL, kein DIRECT_URL nötig)
DATABASE_URL=$SUPABASE_DATABASE_URL npm run seed:partner-tiers
DATABASE_URL=$SUPABASE_DATABASE_URL npm run seed:partner-pricing

# 4. Verifikation
#    - Supabase Dashboard → Table Editor → 6 neue Tabellen sichtbar (Partner*)
#    - get_advisors (MCP) sollte keine RLS-Warnung für diese Tabellen werfen,
#      weil wir bewusst KEIN RLS einsetzen — Enforcement ist App-Layer.

# 5. Tests
npm test partner
```

> **Hinweis zu RLS:** Supabase wirft im Dashboard standardmäßig eine
> Warnung „table is public, no RLS policy". Für die Partner-Tabellen ist
> das gewollt — das Service-Role-Key-Pattern via Prisma umgeht RLS sowieso,
> und Enforcement passiert in `withPartnerScope()` im App-Layer (siehe
> Abschnitt "Gating" oben). Die Warnung kann man im Advisor-Filter
> ausblenden.

## Co-Branding-Regel

Das candiq-Siegel ist **nicht** entfernbar. UI-seitig:

- Logo-Upload des Partners erlaubt → Anzeige: „von [Partner], verifiziert durch candiq"
- Footer aller Partner-PDFs, E-Mails und Dashboard-Seiten zeigt das candiq-Wortmarken-Siegel
- Keine Code-Pfade, die das Siegel optional machen — Test in `__tests__/partner-co-brand.test.ts`

## Offene TODOs (in Reihenfolge)

- [ ] **Phase 1**: Prisma-Models `Partner`, `PartnerPricing`, `PartnerTier`, `PartnerCustomer` + Migration + Seed
- [ ] **Phase 2**: `/partner` Landing OHNE EK-Preise (Co-Branded Hero, Tier-Tabelle ohne Zahlen, FAQ, CTA)
- [ ] **Phase 3**: `/partner/register` + Admin-Approval-Queue
- [ ] **Phase 4**: `/partner/dashboard` (Overview, Kunden, Pricing, Co-Brand, Marketing)
- [ ] **Phase 5**: Gating-Tests (EK-Preise nie im Bundle)
- [ ] **Phase 6**: Isolation/Margin/Tier-Tests
- [ ] **Phase 7**: Doku-Finish, Roadmap Stripe-Connect für Partner-Abrechnung

## Wer pflegt was

| Bereich | Wo |
|---|---|
| EK-Preise ändern | Admin-UI → `partner_pricing` (oder direkt `npm run seed:partner-pricing` mit override) |
| Tier-Schwellen | Admin-UI → `partner_tier` |
| Approval | `/admin/partners` |
| Plan-Listenpreise (Single Source of Truth) | `lib/utils.ts` → `HR_PLANS`/`AGENCY_PLANS` (Seed spiegelt nach `partner_pricing.list_price_cents`) |
