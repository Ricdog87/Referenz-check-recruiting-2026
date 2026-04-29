'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'
type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(({ title, description, variant = 'info' }: {
    title: string; description?: string; variant?: ToastVariant
  }) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, title, description, variant }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const variantClasses: Record<ToastVariant, { bar: string; icon: React.ComponentType<{ className?: string }>; iconClass: string }> = {
    success: { bar: 'bg-emerald-500', icon: CheckCircle2, iconClass: 'text-emerald-600' },
    error: { bar: 'bg-rose-500', icon: AlertCircle, iconClass: 'text-rose-600' },
    info: { bar: 'bg-brand-500', icon: Info, iconClass: 'text-brand-600' },
  }
  const { bar, icon: Icon, iconClass } = variantClasses[toast.variant]

  return (
    <div
      className={`pointer-events-auto bg-white rounded-2xl shadow-card-xl border border-border min-w-[280px] max-w-sm flex items-stretch overflow-hidden transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
      }`}
    >
      <div className={`w-1 ${bar}`} />
      <div className="flex-1 p-3.5 flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary leading-tight">{toast.title}</div>
          {toast.description && (
            <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">{toast.description}</div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
