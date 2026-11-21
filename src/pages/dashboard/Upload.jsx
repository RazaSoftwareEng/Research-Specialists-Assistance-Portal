import { useState } from 'react'
import { useDash } from './DashboardLayout'
import { navigate } from '../../lib/router'
import { createDocument, validateFile, CATEGORIES } from '../../lib/supabase'
import { useFeedback } from '../../components/feedback'
import FileDrop from '../../components/FileDrop'
import Icon from '../../components/icons'

const TIPS = [
  'Use .docx or PDF for the best in-browser preview.',
  'Give a clear title, e.g. "RCT protocol – Diabetes study v1".',
  'Add a short description: journal target, deadline or special requests.',
  'Maximum file size is 20 MB.',
]

export default function Upload() {
  const { profile, isAdmin, users, reloadDocs, openDoc } = useDash()
  const { toast } = useFeedback()
  const [form, setForm] = useState({ title: '', description: '', category: 'original_article', owner: profile.id })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function pick(f) {
    setFile(f)
    if (f && !form.title.trim()) setForm((x) => ({ ...x, title: f.name.replace(/\.[^.]+$/, '') }))
  }

  async function submit(e) {
    e.preventDefault()
    const err = validateFile(file)
    if (err) return toast(err, 'error')
    setBusy(true)
    try {
      const doc = await createDocument({
        ownerId: form.owner,
        uploaderId: profile.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        file,
      })
      toast(isAdmin && form.owner !== profile.id ? 'Document added for the user.' : 'Uploaded! It is now waiting for review.')
      await reloadDocs()
      navigate('/dashboard/documents')
      openDoc(doc.id)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="card space-y-5 p-6 lg:col-span-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload a new document</h2>
          <p className="text-sm text-slate-500">It will be sent for review as version 1.</p>
        </div>

        <FileDrop file={file} onChange={pick} />

        {isAdmin && (
          <div>
            <label className="label">Upload on behalf of</label>
            <select className="input" value={form.owner} onChange={set('owner')}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} {u.id === profile.id ? '(me)' : ''} — {u.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Article type</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <button
                type="button"
                key={k}
                onClick={() => setForm({ ...form, category: k })}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  form.category === k ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title *</label>
          <input className="input" required value={form.title} onChange={set('title')} placeholder="e.g. Systematic review on hypertension management" />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea className="input min-h-24" value={form.description} onChange={set('description')} placeholder="Target journal, deadline, or anything the reviewer should know…" />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard/documents')}>
            Cancel
          </button>
          <button className="btn-primary px-6" disabled={busy}>
            <Icon name="upload" className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">Tips for a quick review</h3>
          <ul className="mt-3 space-y-2.5">
            {TIPS.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-slate-600">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">What happens next?</h3>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            {['The reviewer reads your document.', 'You get notes if changes are needed.', 'Upload the revised file as a new version.', 'Document gets approved.'].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
