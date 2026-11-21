import { useMemo, useState } from 'react'
import { useDash } from './DashboardLayout'
import { Link } from '../../lib/router'
import { supabase, STATUS, CATEGORIES, deleteDocument, formatDate } from '../../lib/supabase'
import { StatusBadge, CategoryBadge, Avatar, Empty, timeAgo } from '../../components/ui'
import { useFeedback } from '../../components/feedback'
import Icon from '../../components/icons'

export default function Documents() {
  const { isAdmin, docs, docsLoading, reloadDocs, openDoc, editDoc, users } = useDash()
  const { toast, confirm } = useFeedback()
  const [tab, setTab] = useState(isAdmin ? 'pending' : 'all')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [owner, setOwner] = useState('all')
  const [sort, setSort] = useState('updated')
  const [selected, setSelected] = useState([])

  const count = (s) => (s === 'all' ? docs.length : docs.filter((d) => d.status === s).length)

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = docs.filter(
      (d) =>
        (tab === 'all' || d.status === tab) &&
        (category === 'all' || (d.category ?? 'original_article') === category) &&
        (owner === 'all' || d.user_id === owner) &&
        (!term ||
          d.title.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term) ||
          d.owner?.full_name?.toLowerCase().includes(term) ||
          d.owner?.email?.toLowerCase().includes(term))
    )
    const sorters = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      created: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      oldest: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      title: (a, b) => a.title.localeCompare(b.title),
    }
    return [...list].sort(sorters[sort])
  }, [docs, tab, q, category, owner, sort])

  const allChecked = shown.length > 0 && shown.every((d) => selected.includes(d.id))
  const toggleAll = () => setSelected(allChecked ? [] : shown.map((d) => d.id))
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function remove(d) {
    if (!(await confirm({ title: `Delete "${d.title}"?`, message: 'All versions, files and notes will be permanently removed.', danger: true, confirmText: 'Delete' })))
      return
    try {
      await deleteDocument(d.id)
      toast('Document deleted.')
      setSelected((s) => s.filter((x) => x !== d.id))
      reloadDocs()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  async function bulkDelete() {
    if (!(await confirm({ title: `Delete ${selected.length} documents?`, message: 'This cannot be undone.', danger: true, confirmText: 'Delete all' }))) return
    try {
      for (const id of selected) await deleteDocument(id)
      toast(`${selected.length} documents deleted.`)
      setSelected([])
      reloadDocs()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  async function bulkStatus(status) {
    const { error } = await supabase.from('documents').update({ status }).in('id', selected)
    if (error) return toast(error.message, 'error')
    toast(`Status updated for ${selected.length} documents.`)
    setSelected([])
    reloadDocs()
  }

  const tabs = [['all', 'All'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])]

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k)
              setSelected([])
            }}
            className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
              tab === k ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === k ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
              {count(k)}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder={isAdmin ? 'Search title, description or user…' : 'Search your documents…'} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select className="input sm:w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All article types</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select className="input sm:w-44" value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          )}
          <select className="input sm:w-40" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="created">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
          <button className="btn-secondary" onClick={reloadDocs} title="Refresh">
            <Icon name="refresh" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {isAdmin && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-indigo-800">{selected.length} selected</span>
          <span className="mx-2 h-4 w-px bg-indigo-200" />
          <span className="text-slate-600">Set status:</span>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => bulkStatus(k)} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:border-indigo-400">
              {v.label}
            </button>
          ))}
          <button onClick={bulkDelete} className="btn-danger ml-auto px-3 py-1">
            <Icon name="trash" className="h-4 w-4" /> Delete
          </button>
        </div>
      )}

      {/* Table */}
      {docsLoading ? (
        <Empty title="Loading documents…" />
      ) : !shown.length ? (
        <Empty
          icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="inbox" /></span>}
          title="No documents found"
          action={!isAdmin && docs.length === 0 && <Link to="/dashboard/upload" className="btn-primary">Upload your first document</Link>}
        >
          {docs.length ? 'Try a different tab, filter or search.' : 'Uploaded documents will appear here.'}
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                {isAdmin && (
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-indigo-600" checked={allChecked} onChange={toggleAll} />
                  </th>
                )}
                <th className="px-4 py-3">Document</th>
                {isAdmin && <th className="px-4 py-3">Submitted by</th>}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ver.</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((d) => (
                <tr key={d.id} className={`group hover:bg-slate-50 ${selected.includes(d.id) ? 'bg-indigo-50/50' : ''}`}>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 cursor-pointer accent-indigo-600" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} />
                    </td>
                  )}
                  <td className="max-w-xs px-4 py-3">
                    <button onClick={() => openDoc(d.id)} className="cursor-pointer text-left">
                      <div className="font-medium text-slate-800 group-hover:text-indigo-700">{d.title}</div>
                      {d.description && <div className="truncate text-xs text-slate-500">{d.description}</div>}
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={d.owner?.full_name || '?'} size="h-7 w-7 text-[11px]" />
                        <div className="min-w-0">
                          <div className="truncate text-slate-700">{d.owner?.full_name}</div>
                          <div className="truncate text-xs text-slate-500">{d.owner?.email}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <CategoryBadge category={d.category} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">v{d.current_version}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500" title={formatDate(d.updated_at)}>
                    {timeAgo(d.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openDoc(d.id)} className="btn-primary px-3 py-1.5 text-xs">
                        <Icon name="eye" className="h-4 w-4" /> {isAdmin ? 'Review' : 'Open'}
                      </button>
                      <button onClick={() => editDoc(d.id)} title="Edit" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(d)} title="Delete" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!docsLoading && shown.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          Showing {shown.length} of {docs.length} documents
        </div>
      )}
    </div>
  )
}
