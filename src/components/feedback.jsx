import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Icon from './icons'

const Ctx = createContext(null)

/** Toasts + confirm dialogs for the whole app. */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setDialog(opts)
      }),
    []
  )

  const close = (value) => {
    resolver.current?.(value)
    setDialog(null)
  }

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3 text-sm shadow-lg ${
              t.type === 'error' ? 'border-rose-200' : 'border-emerald-200'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                t.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <Icon name={t.type === 'error' ? 'alert' : 'check'} className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="pt-0.5 text-slate-700">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div data-layer="dialog" className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => close(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  dialog.danger ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                <Icon name={dialog.danger ? 'alert' : 'check'} />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{dialog.title}</h3>
                {dialog.message && <p className="mt-1 text-sm text-slate-600">{dialog.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => close(false)}>
                Cancel
              </button>
              <button className={dialog.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)} autoFocus>
                {dialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useFeedback = () => useContext(Ctx)
