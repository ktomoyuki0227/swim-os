"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // フェードイン
    const show = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 3500)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(timer)
    }
  }, [toast.id, onRemove])

  const colors = {
    success: "bg-[#1a2332] text-white border-[#0f8a4f]/40",
    error: "bg-[#1a2332] text-white border-[#E8614D]/40",
    info: "bg-[#1a2332] text-white border-[#005F8C]/40",
  }

  const icons = {
    success: (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f8a4f]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    ),
    error: (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8614D]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    ),
    info: (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005F8C]">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    ),
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${colors[toast.type]} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{ minWidth: "240px", maxWidth: "360px" }}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium leading-snug">{toast.message}</p>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* ボトムライト固定トースト */}
      <div
        className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 md:bottom-6"
        aria-live="polite"
        aria-label="通知"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
