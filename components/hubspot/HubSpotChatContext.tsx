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

  // MutationObserver: erzwingt die Bottom-Right-Position direkt am Element
  // sobald HubSpot den Container ins DOM injiziert oder seine Styles aendert.
  // Notwendig auf Desktop-Viewports — HubSpot ueberschreibt unser stylesheet
  // dynamisch per inline-style.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apply = (el: HTMLElement) => {
      // Direkt am Element setzen — schlaegt jeden anderen Inline-Style.
      el.style.setProperty('position', 'fixed', 'important')
      el.style.setProperty('top', 'auto', 'important')
      el.style.setProperty('left', 'auto', 'important')
      el.style.setProperty('bottom', '20px', 'important')
      el.style.setProperty('right', '20px', 'important')
      el.style.setProperty('z-index', '2147483000', 'important')
      el.style.setProperty('transform', 'none', 'important')
    }

    const tryApply = () => {
      const el = document.getElementById('hubspot-messages-iframe-container')
      if (el instanceof HTMLElement) apply(el)
    }

    // Initial Pass
    tryApply()

    // MutationObserver auf <body> — schlaegt zu wenn HubSpot den Container
    // einfuegt oder seinen style/class veraendert
    const observer = new MutationObserver(() => {
      tryApply()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
