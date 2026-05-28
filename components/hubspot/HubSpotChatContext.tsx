'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

/**
 * HubSpot Chat & Tracking Context.
 *
 * Was wir hier tun:
 * 1. setPath bei jedem Route-Wechsel → Sales sieht im Chat-Inbox,
 *    auf welcher Page der Visitor gerade ist (z.B. /branchen/tech-recruiting)
 * 2. trackPageView damit HubSpot die Page-Visits des Visitors mitprotokolliert
 *    → erscheint in der Contact-Timeline
 * 3. identify wenn ein eingeloggter User existiert (next-auth Session) →
 *    Sales sieht sofort Name + E-Mail + Firma statt 'Anonymer Visitor'
 *
 * Doku: https://developers.hubspot.com/docs/api/conversation/tracking-code-api
 *
 * Effekt: bei jedem Chat-Start hat Sales sofort
 *   - die genaue URL und Visit-History
 *   - bei eingeloggten Usern: vollen Contact-Datensatz im HubSpot CRM
 */
export function HubSpotChatContext() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Route-Change → setPath + trackPageView
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as unknown as { _hsq?: Array<unknown[]> }
    w._hsq = w._hsq ?? []
    w._hsq.push(['setPath', pathname])
    w._hsq.push(['trackPageView'])
  }, [pathname])

  // Session-Change → identify (oder revokeIdentity bei Logout)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (status === 'loading') return
    const w = window as unknown as { _hsq?: Array<unknown[]> }
    w._hsq = w._hsq ?? []

    if (session?.user?.email) {
      const identifyPayload: Record<string, string> = {
        email: session.user.email,
      }
      if (session.user.name) {
        identifyPayload.firstname = session.user.name.split(' ')[0]
        const lastNames = session.user.name.split(' ').slice(1).join(' ')
        if (lastNames) identifyPayload.lastname = lastNames
      }
      // Marker, dass der Visitor ein eingeloggter candiq-User ist —
      // hilft Sales/Support direkt sehen 'Bestandskunde, kein Cold Lead'
      identifyPayload.candiq_user_role = 'logged_in_dashboard_user'
      w._hsq.push(['identify', identifyPayload])
      w._hsq.push(['trackPageView'])
    }
    // Logout: wir lassen das HubSpot-Cookie unangetastet — der naechste
    // Login wird per identify wieder ueberschrieben. Aktives revoke
    // wuerde Tracking ganz abstellen, das ist nicht gewollt.
  }, [session, status])

  // Widget-Position EINMALIG setzen sobald HubSpot den Container
  // einfuegt. KEIN dauerhafter Override, sonst kann HubSpot das Widget
  // bei Klick nicht ordentlich oeffnen (Welcome-Message + Footer
  // werden geblockt).
  useEffect(() => {
    if (typeof window === 'undefined') return
    let positioned = false

    const positionOnce = (el: HTMLElement) => {
      if (positioned) return
      positioned = true
      // Nur Position und Anchor erzwingen, KEIN transform/width/height —
      // HubSpot braucht Hoheit ueber Layout fuer Open-Animation.
      el.style.setProperty('position', 'fixed', 'important')
      el.style.setProperty('top', 'auto', 'important')
      el.style.setProperty('left', 'auto', 'important')
      el.style.setProperty('bottom', '20px', 'important')
      el.style.setProperty('right', '20px', 'important')
      el.style.setProperty('z-index', '2147483000', 'important')
    }

    const tryPosition = () => {
      const el = document.getElementById('hubspot-messages-iframe-container')
      if (el instanceof HTMLElement) {
        positionOnce(el)
        observer.disconnect()
      }
    }

    // Beobachtet nur bis Container auftaucht, danach disconnect.
    const observer = new MutationObserver(tryPosition)
    observer.observe(document.body, { childList: true, subtree: true })

    // Initial pass falls Container schon da ist
    tryPosition()

    return () => observer.disconnect()
  }, [])

  return null
}
