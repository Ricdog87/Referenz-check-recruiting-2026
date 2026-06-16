#!/usr/bin/env bash
# Smoke-Test: prueft, dass alle oeffentlichen Routes den erwarteten
# HTTP-Status liefern.
#   - ROUTES:    muessen (ggf. nach internem Redirect, -L) 200 liefern
#   - REDIRECTS: muessen als 301 (Permanent Redirect) antworten
#     (H1: /referenzcheck-{stadt} -> /referenzpruefung/{stadt})
#
# Verwendung:
#   bash scripts/smoke-routes.sh https://candiq-preview-xyz.vercel.app
#   bash scripts/smoke-routes.sh            (default: https://candiq.de)
#
# WICHTIG: Vor jedem Merge nach main MUSS dieses Skript auf dem Vercel-
# Preview-Deploy sauber durchlaufen. (PR #62 hat Production gekillt, weil ein
# i18n-Hook-Provider auf Non-i18n-Routes fehlte — solche 500er werden hier
# vor dem Merge sichtbar.)

set -u
BASE_URL="${1:-https://candiq.de}"

# Oeffentliche Pages, die 200 liefern muessen (-L folgt internen 3xx,
# z. B. /waitlist-agency 307 -> 200).
ROUTES=(
  "/"
  "/en"
  "/preise"
  "/demo"
  "/termin"
  "/waitlist-agency"
  "/bewerber"
  "/roi-rechner"
  "/pilotprogramm"
  "/compliance"
  "/fuer/hr-abteilungen"
  "/fuer/mittelstand"
  "/branchen"
  "/branchen/tech-recruiting"
  "/branchen/sales-recruiting"
  "/branchen/healthcare-recruiting"
  "/referenzpruefung"
  "/referenzpruefung/berlin"
  "/vergleich/validato-alternative"
  "/reference-check-dsgvo"
  "/zeugnis-pruefen-lassen"
  "/lebenslauf-verifizieren"
  "/pre-employment-screening"
  "/background-check-dsgvo"
  "/resources"
  "/resources/dsgvo-checkliste-recruiting"
  "/datenschutz"
  "/agb"
  "/impressum"
)

# Alte Geo-URLs: muessen 301 auf den kanonischen Pfad liefern (H1).
REDIRECTS=(
  "/referenzcheck-berlin"
  "/referenzcheck-muenchen"
  "/referenzcheck-hamburg"
  "/referenzcheck-koeln"
  "/referenzcheck-frankfurt"
)

echo "==> Smoke-Test gegen: $BASE_URL"
echo ""
fails=0

echo "-- Public Pages (erwartet 200) --"
for path in "${ROUTES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 "${BASE_URL}${path}")
  if [[ "$code" == "200" ]]; then
    printf "  \033[32m✓\033[0m  %-45s %s\n" "$path" "$code"
  else
    printf "  \033[31m✗\033[0m  %-45s %s (erwartet 200)\n" "$path" "$code"
    fails=$((fails + 1))
  fi
done

echo ""
echo "-- Permanent Redirects (erwartet 301) --"
for path in "${REDIRECTS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${BASE_URL}${path}")
  loc=$(curl -s -o /dev/null -w "%{redirect_url}" --max-time 15 "${BASE_URL}${path}")
  if [[ "$code" == "301" ]]; then
    printf "  \033[32m✓\033[0m  %-45s %s -> %s\n" "$path" "$code" "$loc"
  else
    printf "  \033[31m✗\033[0m  %-45s %s (erwartet 301)\n" "$path" "$code"
    fails=$((fails + 1))
  fi
done

echo ""
total=$(( ${#ROUTES[@]} + ${#REDIRECTS[@]} ))
if [[ $fails -gt 0 ]]; then
  echo "==> ❌ ${fails}/${total} Route(s) mit falschem Status. NICHT mergen."
  exit 1
fi
echo "==> ✅ Alle ${total} Routes wie erwartet (${#ROUTES[@]}x 200, ${#REDIRECTS[@]}x 301). Safe to merge."
