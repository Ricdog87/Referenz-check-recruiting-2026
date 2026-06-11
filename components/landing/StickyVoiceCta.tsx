'use client'

import { useEffect, useState } from 'react'
import { Headphones } from 'lucide-react'

/**
 * Sticky Voice-CTA — taucht ab 80vh Scroll-Position auf und scrollt zum
 * Voice-Demo im Hero. Wer ohne Klick durchscrollt, bekommt den Wow-Moment
 * ein zweites Mal sichtbar angeboten.
 */
export function StickyVoiceCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      // Schwelle: 80 % der ersten Viewport-Höhe. Auf der CTA-Sektion im
      // letzten Drittel der Seite blenden wir wieder aus, damit der
      // statische Final-CTA nicht doppelt im Bild ist.
      const y = window.scrollY
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const past = y > window.innerHeight * 0.8
      const nearBottom = docH > 0 && y > docH * 0.88
      setVisible(past && !nearBottom)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <a
      href="#voice-demo"
      aria-label="candiq Voice ausprobieren"
      className={`fixed bottom-5 right-5 z-40 hidden sm:inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:shadow-fuchsia-500/40 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <Headphones className="h-4 w-4" />
      candiq Voice testen
    </a>
  )
}
