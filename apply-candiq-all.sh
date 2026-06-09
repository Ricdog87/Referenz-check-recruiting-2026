#!/usr/bin/env bash
# apply-candiq-all.sh
# One-Shot-Audit + Action-Helper für candiq.
# Default ist read-only; --delete-branches und --apply-migrations sind Opt-ins.
#
# Usage:
#   bash apply-candiq-all.sh
#   bash apply-candiq-all.sh --delete-branches
#   bash apply-candiq-all.sh --apply-migrations   # braucht $DATABASE_URL gesetzt
#
# Was es ohne Flags macht:
#   - Smoke-Test der Live-Endpoints
#   - Env-Var-Inventar gegen .env.example
#   - Liste der gemergten Branches (nur Anzeige, kein Löschen)
#   - Klar formatierte Punch-List für den Betreiber
#
# Was Flags machen:
#   --delete-branches      löscht alle Remote-Branches die in origin/main
#                          gemergt sind (außer main selbst)
#   --apply-migrations     ruft prisma migrate deploy mit dem aktuellen
#                          $DATABASE_URL — nur lokal/Admin sinnvoll
#

set -u  # error on undefined vars; intentionally NO -e so single failures don't abort the audit

DELETE_BRANCHES=false
APPLY_MIGRATIONS=false
for arg in "$@"; do
  case "$arg" in
    --delete-branches)   DELETE_BRANCHES=true ;;
    --apply-migrations)  APPLY_MIGRATIONS=true ;;
    -h|--help)
      sed -n '1,30p' "$0" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
  esac
done

bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m' "$*"; }
red()   { printf '\033[31m%s\033[0m' "$*"; }
amber() { printf '\033[33m%s\033[0m' "$*"; }
dim()   { printf '\033[2m%s\033[0m' "$*"; }
hr()    { printf '\033[2m%s\033[0m\n' "────────────────────────────────────────────────────────────"; }

BASE_URL="https://candiq.de"

# ─────────────────────────────────────────────────────────────────
# 1) PRE-FLIGHT
# ─────────────────────────────────────────────────────────────────
bold "[1/6] Pre-flight"
hr
if [ ! -f package.json ] || [ ! -d prisma ]; then
  red "Bitte aus dem Repo-Root ausführen (package.json + prisma fehlen)."; echo
  exit 2
fi
echo "  Branch:   $(git branch --show-current)"
echo "  Tip:      $(git log --oneline -1)"
echo "  Tree:     $(git status --porcelain | wc -l | tr -d ' ') uncommitted change(s)"
echo

# ─────────────────────────────────────────────────────────────────
# 2) LIVE SMOKE-TEST
# ─────────────────────────────────────────────────────────────────
bold "[2/6] Live-Smoke-Test gegen $BASE_URL"
hr

smoke() {
  local path="$1"; local method="${2:-GET}"; local body="${3:-}"
  local args=(-s -o /tmp/_apply_resp -w '%{http_code}' --max-time 15)
  if [ "$method" = "POST" ]; then
    args+=(-X POST -H 'Content-Type: application/json' -d "$body")
  fi
  local code
  code=$(curl "${args[@]}" "$BASE_URL$path" 2>/dev/null || echo "000")
  printf "  %-50s " "$method $path"
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then green "$code"; echo
  elif [ "$code" = "401" ] || [ "$code" = "404" ]; then amber "$code"; echo " (auth/optional)"
  else red "$code"; echo
  fi
}

smoke "/"
smoke "/referenzpruefung"
smoke "/preise"
smoke "/robots.txt"
smoke "/sitemap.xml"
smoke "/logo.svg"
smoke "/opengraph-image"

# Critical: der neue Preview-Endpoint (P4 → live nach PR #78)
PREVIEW_BODY='{"stations":[{"company":"Candiq GmbH","title":"Recruiting Specialist","startDate":"2020-01","endDate":"2022-12"}],"education":[],"referees":[{"name":"Mara M.","company":"Trust","role":"Head","email":"m@t.com"}]}'
smoke "/api/cv-analysis/preview" "POST" "$PREVIEW_BODY"
echo "    └─ Wenn 200: CV-Preview-Endpoint läuft mit echter Berechnung"

# Marketing-Marker
PAGE=$(curl -s --max-time 15 "$BASE_URL/" 2>/dev/null)
HOMEPAGE_HAS_LIVE_DEMO=$(printf '%s' "$PAGE" | grep -c "Probieren Sie den Fabrikations-Check" || true)
HOMEPAGE_HAS_REPOSITIONING=$(printf '%s' "$PAGE" | grep -c "menschliche Vertrauensschicht" || true)
HOMEPAGE_HAS_GA_PRESENT=$(printf '%s' "$PAGE" | grep -c "googletagmanager\|google-analytics" || true)
HOMEPAGE_HAS_COOKIE_BTN=$(printf '%s' "$PAGE" | grep -c "Cookie-Einstellungen" || true)
unset PAGE
echo "  Marketing-Check:"
echo "    Live-Demo-Widget vorhanden:      $([ "$HOMEPAGE_HAS_LIVE_DEMO" -gt 0 ] && green "ja" || red "nein")"
echo "    Vertrauensschicht-Headline:      $([ "$HOMEPAGE_HAS_REPOSITIONING" -gt 0 ] && green "ja" || red "nein")"
echo "    GA NICHT im SSR-HTML (Opt-in):   $([ "$HOMEPAGE_HAS_GA_PRESENT" -eq 0 ] && green "richtig" || red "leakt")"
echo "    Cookie-Einstellungen im Footer:  $([ "$HOMEPAGE_HAS_COOKIE_BTN" -gt 0 ] && green "ja" || red "nein")"
echo

# ─────────────────────────────────────────────────────────────────
# 3) ENV-VAR-INVENTAR vs. .env.example
# ─────────────────────────────────────────────────────────────────
bold "[3/6] Env-Var-Inventar (Code vs. .env.example)"
hr
USED=$(mktemp); DOCUMENTED=$(mktemp)
grep -rohE 'process\.env\.[A-Z][A-Z0-9_]+' app lib middleware.ts components 2>/dev/null \
  | sort -u | sed 's/process\.env\.//' > "$USED"
grep -oE '^[A-Z][A-Z0-9_]+(?==)' .env.example 2>/dev/null | sort -u > "$DOCUMENTED"
# Fallback wenn -P / Lookahead nicht supported
if [ ! -s "$DOCUMENTED" ]; then
  grep -E '^[A-Z][A-Z0-9_]+=' .env.example | sed 's/=.*//' | sort -u > "$DOCUMENTED"
fi

MISSING_IN_EXAMPLE=$(comm -23 "$USED" "$DOCUMENTED")
ORPHAN_IN_EXAMPLE=$(comm -13 "$USED" "$DOCUMENTED")

if [ -z "$MISSING_IN_EXAMPLE" ]; then
  green "  ✓ Alle im Code verwendeten Env-Vars sind in .env.example dokumentiert."; echo
else
  red "  ✗ Im Code verwendet, aber NICHT in .env.example:"; echo
  echo "$MISSING_IN_EXAMPLE" | sed 's/^/      - /'
fi
echo

if [ -n "$ORPHAN_IN_EXAMPLE" ]; then
  amber "  ⚠ In .env.example dokumentiert, aber im Code nicht referenziert:"; echo
  echo "$ORPHAN_IN_EXAMPLE" | sed 's/^/      - /'
  echo
fi

rm -f "$USED" "$DOCUMENTED"

# ─────────────────────────────────────────────────────────────────
# 4) PR-/BRANCH-HYGIENE
# ─────────────────────────────────────────────────────────────────
bold "[4/6] Branch-Hygiene"
hr
git fetch --prune origin 2>/dev/null
MERGED=$(git branch -r --merged origin/main | grep -vE 'origin/main$|origin/HEAD' | sed 's|^[ *]*origin/||' | sort)
MERGED_COUNT=$(printf '%s\n' "$MERGED" | grep -c . || true)
UNMERGED=$(git branch -r --no-merged origin/main | grep -vE 'origin/HEAD' | sed 's|^[ *]*origin/||' | sort)
UNMERGED_COUNT=$(printf '%s\n' "$UNMERGED" | grep -c . || true)

echo "  gemergt in main, kann weg:     $(amber "$MERGED_COUNT") Branches"
echo "  nicht gemergt (offene Arbeit): $(amber "$UNMERGED_COUNT") Branches"
echo

if [ "$DELETE_BRANCHES" = "true" ]; then
  if [ "$MERGED_COUNT" -gt 0 ]; then
    bold "  → Lösche $MERGED_COUNT gemergte Remote-Branches..."
    printf '%s\n' "$MERGED" | while read -r b; do
      [ -z "$b" ] && continue
      if git push origin --delete "$b" >/dev/null 2>&1; then
        green "    ✓ gelöscht: $b"; echo
      else
        red "    ✗ konnte nicht löschen: $b"; echo
      fi
    done
  fi
else
  dim "  (Default: nicht gelöscht. Mit --delete-branches re-runnen, dann werden alle gemergten weggeräumt.)"; echo
  if [ "$MERGED_COUNT" -gt 0 ] && [ "$MERGED_COUNT" -le 20 ]; then
    echo "  Beispiel-Liste:"
    printf '%s\n' "$MERGED" | head -10 | sed 's/^/      /'
    [ "$MERGED_COUNT" -gt 10 ] && echo "      … und $((MERGED_COUNT - 10)) weitere"
  fi
fi
echo

# ─────────────────────────────────────────────────────────────────
# 5) MIGRATIONS-CHECK
# ─────────────────────────────────────────────────────────────────
bold "[5/6] Prisma-Migrations-Status"
hr
MIGRATIONS=$(ls prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml | wc -l | tr -d ' ')
echo "  Migrations-Verzeichnisse: $MIGRATIONS"
ls prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml | sed 's/^/      - /'
echo

if [ "$APPLY_MIGRATIONS" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    red "  ✗ --apply-migrations gesetzt, aber \$DATABASE_URL ist leer."; echo
    echo "    Beispiel: DATABASE_URL='postgresql://...' bash apply-candiq-all.sh --apply-migrations"
  else
    bold "  → Führe prisma migrate deploy aus..."
    npx prisma migrate deploy 2>&1 | sed 's/^/    /'
  fi
else
  dim "  (Default: nicht angewendet. PR #77 Migration anwenden mit einem der folgenden Pfade.)"; echo
  echo "    Pfad A — lokal mit Prod-DATABASE_URL:"
  echo "      $(amber 'DATABASE_URL="<prod-url>" npx prisma migrate deploy')"
  echo "    Pfad B — über admin-init Endpoint:"
  echo "      $(amber 'curl -X POST https://candiq.de/api/admin/init -H "Authorization: Bearer \$INIT_SECRET"')"
fi
echo

# ─────────────────────────────────────────────────────────────────
# 6) PUNCH-LIST (was DU jetzt machen musst)
# ─────────────────────────────────────────────────────────────────
bold "[6/6] Punch-List für den Betreiber"
hr
cat <<'PUNCH'

  P0 [PFLICHT] ─ Prod-DB Migration anwenden
       Solange das nicht durch ist, crasht POST /api/candidates/:id/invite
       in Production mit "relation \"ConsentToken\" does not exist".
       → siehe Pfad A oder B oben

  P1 ── Reviewer-Workflow + PDF-Generierung (separater Sprint)
       siehe AUDIT.md im Repo, Abschnitt P1
       siehe Cowork-Prompt aus voriger Session

  P2 ── GSC + Bing + IndexNow Tokens nachreichen
       Vercel Env-Vars setzen:
         NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
         NEXT_PUBLIC_BING_SITE_VERIFICATION
         NEXT_PUBLIC_INDEXNOW_KEY     ($(openssl rand -hex 16))

  P3 ── Auto-IndexNow-Ping nach Deploy (low effort, hoher SEO-Wert)

  P4 ── Branch-Hygiene
       Re-run mit:  bash apply-candiq-all.sh --delete-branches

  P5 ── Vercel-Env-Var-Vollständigkeitscheck
       Pflicht-Vars siehe Cowork-Prompt. Diese Skript-Section liefert
       die Code-Seite. Vercel-Dashboard-Seite kann nur der Mensch.

  GA4-Admin-TODOs (nur im GA4-Admin)
       - Datenaufbewahrung auf max. 14 Monate
       - "Google-Signale" deaktivieren
       - Data-Processing-Terms akzeptieren
       - EU-Datenregion wählen

PUNCH

bold "Fertig."
echo "Vollständige Kontext-Dokumente im Repo:"
echo "  - AUDIT.md (kritischer-Pfad-Audit)"
echo "  - .env.example (Pflicht-Env-Vars)"
echo
