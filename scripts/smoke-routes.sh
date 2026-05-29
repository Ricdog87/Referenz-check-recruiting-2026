#!/usr/bin/env bash
# Smoke-Test: prueft, dass alle Public-Routes HTTP 200 zurueckgeben.
# Verwendung:
#   bash scripts/smoke-routes.sh https://candiq-preview-xyz.vercel.app
#   bash scripts/smoke-routes.sh  (default: https://candiq.de)
#
# WICHTIG: Bevor ein i18n-PR nach main gemerged wird, MUSS dieses Skript
# auf dem Vercel-Preview-Deploy laufen und alle 200 liefern. Die Klasse
# Bugs, die PR #62 in Production gekillt hat (LocaleSwitcher ohne
# NextIntlClientProvider auf Non-i18n-Routes), wird hier vor Merge
# sichtbar.

set -u
BASE_URL="${1:-https://candiq.de}"

ROUTES=(
  "/"
  "/en"
  "/preise"
  "/demo"
  "/termin"
  "/waitlist-agency"
  "/branchen"
  "/branchen/tech-recruiting"
  "/branchen/sales-recruiting"
  "/branchen/healthcare-recruiting"
  "/resources"
  "/datenschutz"
  "/agb"
  "/impressum"
)

echo "==> Smoke-Test gegen: $BASE_URL"
echo ""

fails=0
for path in "${ROUTES[@]}"; do
  url="${BASE_URL}${path}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 15 "$url")
  if [[ "$code" == "200" ]]; then
    printf "  \033[32m✓\033[0m  %-50s %s\n" "$path" "$code"
  else
    printf "  \033[31m✗\033[0m  %-50s %s\n" "$path" "$code"
    fails=$((fails + 1))
  fi
done

echo ""
if [[ $fails -gt 0 ]]; then
  echo "==> ❌ ${fails} Route(s) NICHT 200. NICHT mergen."
  exit 1
fi
echo "==> ✅ Alle Routes HTTP 200. Safe to merge."
