import { useEffect, useState } from 'react'
import { supabase, formatDate } from '../lib/supabase'
import { Empty, Alert } from './ui'
import { useFeedback } from './feedback'

export default function MessagesPanel({ onCount }) {
  const [msgs, setMsgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')
  const { confirm, toast } = useFeedback()

  async function load() {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    setMsgs(data ?? [])
    onCount?.((data ?? []).filter((m) => !m.is_read).length)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(m) {
    setOpenId(openId === m.id ? null : m.id)
    if (!m.is_read) {
      await supabase.from('contact_messages').update({ is_read: true }).eq('id', m.id)
      load()
    }
  }

  async function remove(m) {
    if (!(await confirm({ title: `Delete message from ${m.name}?`, danger: true, confirmText: 'Delete' }))) return
    const { error } = await supabase.from('contact_messages').delete().eq('id', m.id)
    if (error) return toast(error.message, 'error')
    toast('Message deleted.')
    load()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-800">Contact messages</h2>
        <button className="btn-secondary px-3 py-1" onClick={load}>
          Refresh
        </button>
      </div>
      {error && (
        <div className="p-4">
          <Alert>{error.includes('contact_messages') ? 'Run supabase/contact_messages.sql in the Supabase SQL Editor first.' : error}</Alert>
        </div>
      )}
      {loading ? (
        <Empty title="Loading messages…" />
      ) : !msgs.length ? (
        <Empty title="No messages yet">Messages sent from the website Contact page will appear here.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {msgs.map((m) => (
            <li key={m.id}>
              <button className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-slate-50" onClick={() => toggle(m)}>
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${m.is_read ? 'bg-transparent' : 'bg-indigo-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className={`text-slate-800 ${m.is_read ? '' : 'font-semibold'}`}>{m.name}</span>
                    <span className="text-xs text-slate-500">{m.email}</span>
                    {m.subject && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{m.subject}</span>}
                  </div>
                  {openId !== m.id && <p className="truncate text-sm text-slate-500">{m.message}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatDate(m.created_at)}</span>
              </button>
              {openId === m.id && (
                <div className="space-y-3 px-9 pb-4">
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{m.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a className="btn-primary px-3 py-1.5" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`}>
                      Reply by email
                    </a>
                    {m.phone && (
                      <a className="btn-secondary px-3 py-1.5" href={`tel:${m.phone}`}>
                        Call {m.phone}
                      </a>
                    )}
                    <button className="btn px-3 py-1.5 text-rose-600 hover:bg-rose-50" onClick={() => remove(m)}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
