/**
 * IndexNow-Key-Endpoint.
 *
 * IndexNow ist ein Protokoll (Bing, Yandex, Naver), bei dem Webmaster
 * Suchmaschinen aktiv informieren, dass sich eine URL geändert hat —
 * statt auf den nächsten Crawl zu warten. Voraussetzung: ein
 * statischer Key-File-Endpoint, der den eigenen Key zurückliefert,
 * damit die Suchmaschine die Ownership der Domain prüfen kann.
 *
 * Wir nutzen NEXT_PUBLIC_INDEXNOW_KEY als Quelle (16+ Zeichen, hex).
 * Der Pfad MUSS zum Inhalt passen — wir hosten ihn unter
 * /<KEY>.txt, weil Bing das genau so erwartet.
 *
 * Siehe: https://www.indexnow.org/documentation
 */
import { NextResponse } from 'next/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const expected = process.env.NEXT_PUBLIC_INDEXNOW_KEY
  if (!expected) notFound()

  // Sicherheits-Check: nur exakt der erwartete Key wird ausgeliefert
  // (verhindert Enumeration). Der Pfad-Param muss exakt mit dem
  // konfigurierten Key übereinstimmen — inkl. `.txt`-Suffix-Strip.
  const supplied = params.key.replace(/\.txt$/i, '')
  if (supplied !== expected) notFound()

  return new NextResponse(expected, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
