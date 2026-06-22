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
| **Auth** | `User.role='PARTNER'` + 1:1-Relation auf `Partner` | Bestehendes NextAuth wiederverwenden, eine Account-Pipeline |
| **EK-Preise** | DB-Tabelle `partner_pricing` pro Plan × Partner | Admin-editierbar, auditierbar, pro Deal verhandelbar |
| **Tier-Schwellen** | Registered 1 / Silver 5 / Gold 15 / Platinum 30 aktive Kunden | Realistisch für DACH-PDL-Markt; in `partner_tier` editierbar |
| **Isolation** | App-Layer-Guards + Vitest, kein RLS | Konsistent mit bestehendem candiq-Pattern (Prisma als Owner) |

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
