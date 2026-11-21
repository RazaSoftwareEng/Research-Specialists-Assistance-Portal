import { useState } from 'react'
import { supabase, CATEGORIES, STATUS } from '../lib/supabase'
import { useDash } from '../pages/dashboard/DashboardLayout'
import { useFeedback } from './feedback'
import Modal from './Modal'

export default function EditDocumentModal({ doc, onClose }) {
  const { isAdmin, reloadDocs } = useDash()
  const { toast } = useFeedback()
  const [form, setForm] = useState({
    title: doc.title,
    description: doc.description ?? '',
    category: doc.category ?? 'original_article',
    status: doc.status,
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e?.preventDefault()
    if (!form.title.trim()) return toast('Title is required.', 'error')
    setBusy(true)
    const patch = { title: form.title.trim(), description: form.description.trim() || null, category: form.category }
    if (isAdmin) patch.status = form.status
    const { error } = await supabase.from('documents').update(patch).eq('id', doc.id)
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast('Document updated.')
    await reloadDocs()
    onClose()
  }

  return (
    <Modal
      title="Edit document"
      subtitle={isAdmin && doc.owner ? `Owner: ${doc.owner.full_name} (${doc.owner.email})` : undefined}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={set('title')} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Article type</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-24" value={form.description} onChange={set('description')} />
        </div>
      </form>
    </Modal>
  )
}
