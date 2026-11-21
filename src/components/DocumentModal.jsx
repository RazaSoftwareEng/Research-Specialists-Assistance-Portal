import { useEffect, useState } from 'react'
import { supabase, formatDate, uploadRevision, deleteDocument, deleteVersion, validateFile } from '../lib/supabase'
import { StatusBadge, CategoryBadge, Alert } from './ui'
import { useFeedback } from './feedback'
import Icon from './icons'
import FilePreview from './FilePreview'
import FileDrop from './FileDrop'

const BANNER = {
  pending: {
    user: ['Waiting for review', 'Your document has been submitted. The admin will review it soon.'],
    admin: ['Needs your review', 'Check the document, then approve it or request changes with a note.'],
    cls: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
  },
  needs_changes: {
    user: ['Changes requested', 'Read the admin feedback below, fix your document and upload the new version.'],
    admin: ['Waiting for the user', 'You requested changes. The user will upload a new version.'],
    cls: 'border-orange-200 bg-orange-50 text-orange-900',
    dot: 'bg-orange-500',
  },
  approved: {
    user: ['Approved', 'Your document has been approved. No further action needed.'],
    admin: ['Approved', 'This document is approved.'],
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-500',
  },
  rejected: {
    user: ['Rejected', 'This document was rejected. See the admin notes for the reason. You can upload a new version.'],
    admin: ['Rejected', 'This document was rejected.'],
    cls: 'border-rose-200 bg-rose-50 text-rose-900',
    dot: 'bg-rose-500',
  },
}

export default function DocumentModal({ doc, profile, onClose, onChanged, onEdit }) {
  const isAdmin = profile.role === 'admin'
  const { confirm, toast } = useFeedback()
  const [versions, setVersions] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loaded, setLoaded] = useState(false)

  async function load() {
    const [v, n] = await Promise.all([
      supabase.from('document_versions').select('*').eq('document_id', doc.id).order('version', { ascending: false }),
      supabase
        .from('document_notes')
        .select('*, author:profiles(full_name, email)')
        .eq('document_id', doc.id)
        .order('created_at', { ascending: false }),
    ])
    if (v.error || n.error) setError((v.error || n.error).message)
    setVersions(v.data ?? [])
    setNotes(n.data ?? [])
    setLoaded(true)
  }

  useEffect(() => {
    load()
  }, [doc.id, doc.current_version, doc.status])

  // Always jump to the latest version when a new one appears
  useEffect(() => {
    setSelectedId(versions[0]?.id ?? null)
  }, [versions[0]?.id])

  // Esc closes the modal; lock page scroll while open
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && !document.querySelector('[data-layer="dialog"]') && onClose()
    window.addEventListener('keydown', h)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = prev
    }
  }, [onClose])

  async function run(fn, msg) {
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      await fn()
      setSuccess(msg)
      await onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // ---- Admin ----
  const review = (status) =>
    run(async () => {
      if ((status === 'needs_changes' || status === 'rejected') && !note.trim())
        throw new Error('Please write a note so the user knows what to change.')
      if (note.trim()) {
        const { error } = await supabase
          .from('document_notes')
          .insert({ document_id: doc.id, author_id: profile.id, version: doc.current_version, note: note.trim() })
        if (error) throw error
      }
      if (status) {
        const { error } = await supabase.from('documents').update({ status }).eq('id', doc.id)
        if (error) throw error
      }
      setNote('')
      await load()
    }, status === 'approved' ? 'Document approved.' : status ? 'Review sent to the user.' : 'Note added.')

  // ---- User ----
  const submitRevision = () =>
    run(async () => {
      const err = validateFile(file)
      if (err) throw new Error(err)
      await uploadRevision(doc, profile.id, file)
      setFile(null)
    }, 'New version uploaded and sent for review.')

  const remove = async () => {
    if (!(await confirm({ title: `Delete "${doc.title}"?`, message: 'All versions, files and notes will be permanently removed.', danger: true, confirmText: 'Delete' })))
      return
    setBusy(true)
    try {
      await deleteDocument(doc.id)
      toast('Document deleted.')
      await onChanged()
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const selected = versions.find((v) => v.id === selectedId) ?? versions[0]
  const banner = BANNER[doc.status] ?? BANNER.pending
  const [bTitle, bText] = isAdmin ? banner.admin : banner.user
  const latestNote = notes[0]
  const canResubmit = isAdmin || doc.status !== 'approved'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 sm:p-4" onClick={onClose}>
      <div className="card my-4 w-full max-w-7xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-slate-800">{doc.title}</h2>
              <StatusBadge status={doc.status} />
              <CategoryBadge category={doc.category} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {isAdmin && doc.owner ? `${doc.owner.full_name} · ${doc.owner.email} · ` : ''}
              {versions.length} version{versions.length === 1 ? '' : 's'} · updated {formatDate(doc.updated_at)}
            </p>
            {doc.description && <p className="mt-1 text-sm text-slate-600">{doc.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button onClick={onEdit} className="btn-secondary px-3 py-1.5">
              <Icon name="edit" className="h-4 w-4" /> Edit
            </button>
          )}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="cursor-pointer rounded-lg px-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
          </div>
        </div>

        {/* Status banner */}
        <div className={`flex items-start gap-3 border-b px-5 py-3 ${banner.cls}`}>
          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${banner.dot}`} />
          <div className="text-sm">
            <span className="font-semibold">{bTitle}.</span> {bText}
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-3">
          {/* ---------- Preview ---------- */}
          <div className="min-w-0 space-y-3 lg:col-span-2">
            {versions.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">Version</span>
                {versions.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    title={`${v.file_name} · ${formatDate(v.created_at)}`}
                    className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                      selected?.id === v.id
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400'
                    }`}
                  >
                    v{v.version}
                    {i === 0 ? ' · latest' : ''}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && selected && selected.id !== versions[0]?.id && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                You are viewing an older version (v{selected.version}).
                <button
                  className="cursor-pointer font-medium text-rose-600 hover:underline"
                  onClick={async () => {
                    if (!(await confirm({ title: `Delete version v${selected.version}?`, message: 'The file of this version will be removed permanently.', danger: true, confirmText: 'Delete version' }))) return
                    try {
                      await deleteVersion(selected)
                      toast('Version deleted.')
                      setSelectedId(null)
                      await load()
                    } catch (e) {
                      toast(e.message, 'error')
                    }
                  }}
                >
                  Delete this version
                </button>
              </div>
            )}

            {selected ? (
              <FilePreview key={selected.id} version={selected} isLatest={selected.id === versions[0]?.id} />
            ) : (
              <div className="flex h-[65vh] min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                {loaded ? 'No file found for this document.' : 'Loading…'}
              </div>
            )}
          </div>

          {/* ---------- Side panel ---------- */}
          <div className="space-y-4">
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>

            {/* User: latest feedback highlighted */}
            {!isAdmin && latestNote && doc.status !== 'approved' && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  {doc.status === 'pending' ? 'Latest admin feedback' : 'What to change'}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">{latestNote.note}</p>
                <div className="mt-2 text-xs text-slate-500">
                  {latestNote.version ? `On v${latestNote.version} · ` : ''}
                  {formatDate(latestNote.created_at)}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Your review</h3>
                <p className="mb-2 text-xs text-slate-500">Reviewing v{doc.current_version}. The note is shown to the user.</p>
                <textarea
                  className="input min-h-28"
                  placeholder="e.g. Please add your signature on page 2 and use a clearer scan."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="mt-3 space-y-2">
                  <button className="btn-warning w-full" disabled={busy} onClick={() => review('needs_changes')}>
                    Request changes
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-success" disabled={busy} onClick={() => review('approved')}>
                      Approve
                    </button>
                    <button className="btn-danger" disabled={busy} onClick={() => review('rejected')}>
                      Reject
                    </button>
                  </div>
                  <button className="btn-secondary w-full" disabled={busy || !note.trim()} onClick={() => review(null)}>
                    Save note only
                  </button>
                </div>
              </div>
            )}
            {canResubmit && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-slate-800">{isAdmin ? 'Upload a corrected version' : 'Upload updated file'}</h3>
                  <p className="mb-3 text-xs text-slate-500">
                    It will be saved as <strong>v{doc.current_version + 1}</strong> and sent to the admin for review.
                  </p>
                  <FileDrop file={file} onChange={setFile} compact />
                  <button className="btn-primary mt-3 w-full" disabled={busy || !file} onClick={submitRevision}>
                    {busy ? 'Uploading…' : 'Submit new version'}
                  </button>
                </div>
            )}

            {/* Notes history */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Feedback history <span className="font-normal text-slate-400">({notes.length})</span>
              </h3>
              {notes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                  {isAdmin ? 'No notes yet. Write one above.' : 'No feedback from the admin yet.'}
                </p>
              ) : (
                <ol className="relative max-h-80 space-y-3 overflow-y-auto border-l-2 border-slate-200 pl-4">
                  {notes.map((n) => (
                    <li key={n.id} className="relative">
                      <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" />
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{n.author?.full_name || 'Admin'}</span>
                        {n.version && <span className="rounded bg-slate-100 px-1.5 py-0.5">v{n.version}</span>}
                        <span>{formatDate(n.created_at)}</span>
                        {isAdmin && (
                          <button
                            title="Delete note"
                            className="ml-auto cursor-pointer rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            onClick={async () => {
                              if (!(await confirm({ title: 'Delete this note?', danger: true, confirmText: 'Delete' }))) return
                              const { error } = await supabase.from('document_notes').delete().eq('id', n.id)
                              if (error) return toast(error.message, 'error')
                              toast('Note deleted.')
                              load()
                            }}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">{n.note}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <button className="w-full cursor-pointer rounded-lg py-2 text-sm text-rose-600 hover:bg-rose-50" disabled={busy} onClick={remove}>
              Delete document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
