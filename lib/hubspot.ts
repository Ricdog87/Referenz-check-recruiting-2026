/**
 * HubSpot CRM Sync — minimaler Wrapper.
 *
 * Verwendet HubSpot CRM v3 API. Authentication via Service-Key
 * (Bearer-Token), siehe https://developers.hubspot.com/docs/api/private-apps.
 *
 * Best-effort: alle Funktionen schlucken Fehler, loggen sie und
 * geben { ok: false } zurueck. Sie sind als Sync-Hop hinter unserem
 * eigenen DB-Insert gedacht — der Lead darf nie verloren gehen, nur
 * weil HubSpot mal hustet.
 */

import { redactEmail, redactEmails } from '@/lib/redact'

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY
const HUBSPOT_API_BASE = process.env.HUBSPOT_API_BASE ?? 'https://api.hubapi.com'

export type ContactProperties = {
  email: string
  firstname?: string
  lastname?: string
  company?: string
  jobtitle?: string
  // Eigene Properties (frei waehlbar — HubSpot erstellt sie nicht
  // automatisch; muessen vorher im HubSpot CRM angelegt sein,
  // sonst werden sie ignoriert).
  [key: string]: string | undefined
}

export type SyncResult = { ok: true; contactId: string } | { ok: false; reason: string }

function isConfigured(): boolean {
  return Boolean(HUBSPOT_API_KEY)
}

/**
 * Upsert-Contact via "Create or Update" — HubSpot CRM API.
 * Wir nutzen "search by email" + create/update um den Email-Konflikt
 * zu vermeiden.
 */
export async function upsertContact(props: ContactProperties): Promise<SyncResult> {
  if (!isConfigured()) {
    console.warn('[hubspot] not-configured — HUBSPOT_API_KEY missing')
    return { ok: false, reason: 'HUBSPOT_API_KEY not configured' }
  }
  if (!props.email) {
    return { ok: false, reason: 'email is required' }
  }

  // HubSpot Standard-Properties die auf jedem Portal existieren.
  // Alles andere (jobtitle, company_size, custom_*, …) muss vorher im
  // HubSpot CRM angelegt sein, sonst lehnt die API mit
  // PROPERTY_DOESNT_EXIST ab.
  const ALLOWED = new Set([
    'email', 'firstname', 'lastname', 'company', 'phone',
    'website', 'jobtitle', 'lifecyclestage', 'hs_lead_status',
    'message', 'address', 'city', 'state', 'zip', 'country',
    // candiq-eigene Properties (HubSpot Settings → Properties → Contact)
    'candiq_source', 'candiq_hires_per_year', 'candiq_newsletter_opt_in',
    // AI-Concierge-Lead-Scoring-Properties (PR #88 + #89). Existieren
    // im HubSpot-Portal seit 12.06.2026; fehlten in dieser Allowlist,
    // weshalb candiq_lead_score & Co. stillschweigend verworfen wurden
    // und die Active-List "candiq Hot Leads (Score >= 60)" leer blieb.
    'candiq_lead_score', 'candiq_lead_intent', 'candiq_lead_industry',
    'candiq_lead_timing', 'candiq_lead_source', 'candiq_lead_pathname',
    'candiq_lead_summary',
  ])

  try {
    // 1) Suche nach existierendem Contact per E-Mail
    const searchRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: 'email', operator: 'EQ', value: props.email.toLowerCase() },
            ],
          },
        ],
        properties: ['email'],
        limit: 1,
      }),
    })
    if (!searchRes.ok) {
      const text = await searchRes.text()
      const reason = `search ${searchRes.status}: ${redactEmails(text.slice(0, 200))}`
      console.error('[hubspot] search-failed', { status: searchRes.status, body: redactEmails(text.slice(0, 500)) })
      return { ok: false, reason }
    }
    const searchData = (await searchRes.json()) as {
      total?: number
      results?: Array<{ id: string }>
    }

    // Properties gegen ALLOWED-Whitelist filtern. Verworfene Properties
    // sichtbar machen — sonst sucht man stundenlang wenn ein neuer
    // Custom-Property-Name in der Whitelist fehlt (genau der Bug, der
    // den Hot-Lead-Sync seit Anlage der candiq_lead_*-Properties
    // unsichtbar gemacht hat).
    const properties = Object.fromEntries(
      Object.entries(props).filter(
        ([k, v]) => ALLOWED.has(k) && v !== undefined && v !== '',
      ),
    )
    const dropped = Object.keys(props).filter(
      (k) => props[k] !== undefined && props[k] !== '' && !ALLOWED.has(k),
    )
    if (dropped.length > 0) {
      console.warn('[hubspot] properties-dropped-not-in-allowlist', {
        email: redactEmail(props.email),
        dropped,
        hint: 'In lib/hubspot.ts in das ALLOWED-Set aufnehmen.',
      })
    }

    if (searchData.results?.[0]?.id) {
      // 2a) Existiert → Update
      const id = searchData.results[0].id
      const updateRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })
      if (!updateRes.ok) {
        const text = await updateRes.text()
        const reason = `update ${updateRes.status}: ${redactEmails(text.slice(0, 200))}`
        console.error('[hubspot] update-failed', {
          contactId: id,
          status: updateRes.status,
          body: redactEmails(text.slice(0, 500)),
          sentProperties: Object.keys(properties),
        })
        return { ok: false, reason }
      }
      return { ok: true, contactId: id }
    }

    // 2b) Existiert nicht → Create
    const createRes = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })
    if (!createRes.ok) {
      const text = await createRes.text()
      const reason = `create ${createRes.status}: ${redactEmails(text.slice(0, 200))}`
      console.error('[hubspot] create-failed', {
        email: redactEmail(props.email),
        status: createRes.status,
        body: redactEmails(text.slice(0, 500)),
        sentProperties: Object.keys(properties),
      })
      return { ok: false, reason }
    }
    const createData = (await createRes.json()) as { id?: string }
    if (!createData.id) {
      return { ok: false, reason: 'create response missing id' }
    }
    return { ok: true, contactId: createData.id }
  } catch (err: any) {
    return { ok: false, reason: `exception: ${err?.message ?? 'unknown'}` }
  }
}

/**
 * Optional: Contact zu einer statischen Liste hinzufuegen.
 * listId via Env HUBSPOT_PILOT_LIST_ID.
 *
 * HubSpot Lists v3 API: POST /crm/v3/lists/{listId}/memberships/add
 */
export async function addContactToList(contactId: string, listId: string): Promise<SyncResult> {
  if (!isConfigured()) {
    return { ok: false, reason: 'HUBSPOT_API_KEY not configured' }
  }
  if (!listId) {
    return { ok: false, reason: 'listId is required' }
  }
  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/lists/${listId}/memberships/add`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([contactId]),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, reason: `add-to-list ${res.status}: ${text.slice(0, 200)}` }
    }
    return { ok: true, contactId }
  } catch (err: any) {
    return { ok: false, reason: `exception: ${err?.message ?? 'unknown'}` }
  }
}

export { isConfigured as isHubspotConfigured }
