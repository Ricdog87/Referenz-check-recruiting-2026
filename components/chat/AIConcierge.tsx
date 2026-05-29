'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react'

/**
 * candiq AI-Concierge — eigenes React-Widget, kein iframe.
 *
 * - Floating Bubble unten rechts auf Public-Pages
 * - Klick → Chat-Panel öffnet sich (Mobile: full-screen)
 * - Streamt Antwort vom /api/chat Edge-Endpoint
 * - Conversation lebt nur im React-State des Tabs (kein localStorage,
 *   kein Cookie, keine Persistierung) → DSGVO-friendly by design
 * - Bei Sales-Intent verlinkt die KI selbst /termin etc.
 */

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function AIConcierge() {
  const pathname = usePathname() ?? '/'
  const isEn = pathname.startsWith('/en')
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const welcome = isEn
    ? "Hi! I'm the candiq concierge. Ask me about pricing, GDPR, the 7-day onboarding, or jump straight to booking a 15-min walkthrough."
    : 'Hi! Ich bin der candiq-Concierge. Fragen Sie mich zu Preisen, DSGVO, Onboarding oder buchen Sie direkt einen 15-Min-Termin.'

  const placeholder = isEn ? 'Type your question…' : 'Frage stellen…'

  // Auto-scroll bei neuer Message
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  // Focus input beim Öffnen
  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  // ESC schließt das Panel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError(null)
    setInput('')

    const userMsg: Message = { id: uid(), role: 'user', content: text }
    const assistantMsg: Message = {
      id: uid(),
      role: 'assistant',
      content: '',
      streaming: true,
    }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setBusy(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          currentPath: pathname,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      if (!res.body) throw new Error('Keine Antwort.')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let acc = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const obj = JSON.parse(trimmed)
            if (typeof obj.text === 'string') {
              acc += obj.text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: acc } : m,
                ),
              )
            }
          } catch {
            // ignore
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, streaming: false } : m,
        ),
      )

      // Fire-and-forget Sales-Intent-Analyse. Ergebnis ist fuer den
      // Visitor unsichtbar — bei Hot-Lead (Score >= 60) wird intern
      // gealertet. Fehler schlucken: darf das Chat-UX nie blocken.
      const intentPayload = [...history, { role: assistantMsg.role, content: acc }]
        .map((m) => ({ role: m.role, content: m.content }))
      try {
        void fetch('/api/chat/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: intentPayload,
            currentPath: pathname,
          }),
          keepalive: true,
        }).catch(() => {})
      } catch {
        // ignore — Best-Effort
      }
    } catch (e: any) {
      setError(e?.message ?? (isEn ? 'Something went wrong.' : 'Etwas ist schiefgelaufen.'))
      // Failed assistant message wieder entfernen
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating Bubble — bottom right, immer da auf Public-Pages */}
      <motion.button
        type="button"
        aria-label={isEn ? 'Open chat' : 'Chat öffnen'}
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: open ? 0 : 1, y: open ? 20 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-5 right-5 z-[9000] inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 via-brand-500 to-violet text-white px-4 py-3 shadow-[0_10px_30px_-8px_rgba(79,70,229,0.55)] hover:shadow-[0_14px_40px_-8px_rgba(79,70,229,0.7)] hover:scale-[1.03] transition-all duration-200 ring-1 ring-white/15"
        style={{ pointerEvents: open ? 'none' : 'auto' }}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">
          {isEn ? 'Ask candiq' : 'candiq fragen'}
        </span>
      </motion.button>

      {/* Chat-Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-label="candiq AI-Concierge"
            className="fixed bottom-5 right-5 z-[9001] w-[calc(100vw-2.5rem)] max-w-[420px] h-[min(640px,calc(100vh-2.5rem))] bg-white border border-brand-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.35),0_8px_25px_-8px_rgba(15,23,42,0.15)] flex flex-col overflow-hidden ring-1 ring-brand-100/50"
          >
            {/* Header — candiq brand gradient */}
            <header className="relative flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-br from-brand-600 via-brand-500 to-violet text-white overflow-hidden">
              {/* soft inner highlight */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)]" />
              <div className="relative flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight tracking-tight">
                    {isEn ? 'candiq concierge' : 'candiq-Concierge'}
                  </div>
                  <div className="text-[10px] opacity-85 flex items-center gap-1.5 mt-0.5">
                    <span className="relative inline-flex w-1.5 h-1.5">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                    {isEn ? 'AI · GDPR-compliant · 24/7' : 'KI · DSGVO-konform · 24/7'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label={isEn ? 'Close chat' : 'Chat schließen'}
                onClick={() => setOpen(false)}
                className="relative p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex gap-2.5 items-start">
                  <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet text-white shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm text-text-secondary leading-relaxed bg-brand-50 border border-brand-100 rounded-2xl rounded-tl-md px-3.5 py-2.5 flex-1">
                    {welcome}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
              {error && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>

            {/* Composer */}
            <footer className="border-t border-border p-3">
              <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-xl px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={placeholder}
                  rows={1}
                  disabled={busy}
                  className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none max-h-32 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={busy || !input.trim()}
                  aria-label={isEn ? 'Send' : 'Senden'}
                  className="p-2 rounded-lg bg-gradient-to-br from-brand-600 to-violet hover:from-brand-700 hover:to-brand-700 text-white disabled:opacity-40 disabled:hover:from-brand-600 disabled:hover:to-violet hover:scale-[1.04] active:scale-[0.98] transition-all duration-150 shadow-sm shadow-brand-600/20"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center">
                {isEn
                  ? 'Powered by Claude. No tracking, no cookies, not stored.'
                  : 'Mit Claude generiert. Kein Tracking, keine Cookies, keine Speicherung.'}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MessageBubble({ m }: { m: Message }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-violet text-white rounded-br-md shadow-sm shadow-brand-600/20'
            : 'bg-bg-secondary text-text-primary border border-border rounded-bl-md'
        }`}
      >
        {m.streaming && !m.content ? (
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {' '}…
          </span>
        ) : (
          renderMarkdown(m.content)
        )}
      </div>
    </div>
  )
}

/**
 * Minimaler inline-Markdown-Renderer für Links und Bold.
 * Reicht für die Concierge-Antworten — vermeidet komplettes
 * react-markdown im Client-Bundle.
 */
function renderMarkdown(text: string): React.ReactNode {
  // Reihenfolge: erst Links, dann Bold, dann newlines.
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  let idx = 0
  while ((m = linkPattern.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(formatBold(text.slice(lastIndex, m.index), idx++))
    }
    const url = m[2]
    const safeUrl =
      url.startsWith('http') || url.startsWith('/') || url.startsWith('mailto:')
        ? url
        : '#'
    parts.push(
      <a
        key={`l-${idx++}`}
        href={safeUrl}
        target={safeUrl.startsWith('http') ? '_blank' : undefined}
        rel={safeUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="underline font-semibold hover:opacity-80"
      >
        {m[1]}
      </a>,
    )
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) {
    parts.push(formatBold(text.slice(lastIndex), idx++))
  }
  return parts
}

function formatBold(text: string, baseKey: number): React.ReactNode {
  const boldPattern = /\*\*([^*]+)\*\*/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = boldPattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <strong key={`b-${baseKey}-${k++}`}>{m[1]}</strong>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default AIConcierge
