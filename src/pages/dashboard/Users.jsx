import { useMemo, useState } from 'react'
import { useDash } from './DashboardLayout'
import { supabase, adminCreateUser, adminDeleteUser, formatDate } from '../../lib/supabase'
import { Avatar, RoleBadge, StatusBadge, CategoryBadge, Empty, timeAgo } from '../../components/ui'
import { useFeedback } from '../../components/feedback'
import Modal from '../../components/Modal'
import Icon from '../../components/icons'

export default function Users() {
  const { users, docs, reloadUsers, reloadDocs, profile } = useDash()
  const { toast, confirm } = useFeedback()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [viewId, setViewId] = useState(null)
  const [editUser, setEditUser] = useState(null) // null | {} (new) | user
  const [showAdd, setShowAdd] = useState(false)

  const statsFor = (id) => {
    const mine = docs.filter((d) => d.user_id === id)
    return {
      total: mine.length,
      pending: mine.filter((d) => d.status === 'pending').length,
      approved: mine.filter((d) => d.status === 'approved').length,
    }
  }

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return users.filter(
      (u) =>
        (role === 'all' || u.role === role) &&
        (!term ||
          u.full_name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.institution?.toLowerCase().includes(term) ||
          u.phone?.includes(term))
    )
  }, [users, q, role])

  async function remove(u) {
    const n = statsFor(u.id).total
    const ok = await confirm({
      title: `Delete ${u.full_name || u.email}?`,
      message: `The account and ${n} document${n === 1 ? '' : 's'} (with all files and notes) will be permanently deleted.`,
      danger: true,
      confirmText: 'Delete user',
    })
    if (!ok) return
    try {
      await adminDeleteUser(u.id)
      toast('User deleted.')
      setViewId(null)
      reloadUsers()
      reloadDocs()
    } catch (e) {
      toast(
        /admin_delete_user/.test(e.message) ? 'Run supabase/upgrade_v2.sql in Supabase SQL Editor first.' : e.message,
        'error'
      )
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length
  const newUsers = users.filter((u) => Date.now() - new Date(u.created_at) < 30 * 864e5).length
  const viewing = users.find((u) => u.id === viewId)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total users', users.length, 'users', 'bg-indigo-50 text-indigo-600'],
          ['Admins', admins, 'shield', 'bg-violet-50 text-violet-600'],
          ['New (30 days)', newUsers, 'calendar', 'bg-emerald-50 text-emerald-600'],
        ].map(([l, v, i, c]) => (
          <div key={l} className="card flex items-center justify-between p-5">
            <div>
              <div className="text-sm text-slate-500">{l}</div>
              <div className="mt-1 text-3xl font-bold text-slate-900">{v}</div>
            </div>
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c}`}>
              <Icon name={i} />
            </span>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search name, email, phone or institution…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input sm:w-36" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" className="h-4 w-4" /> Add user
          </button>
        </div>

        {!shown.length ? (
          <Empty title="No users found">Try a different search.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((u) => {
                  const s = statsFor(u.id)
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button className="flex cursor-pointer items-center gap-3 text-left" onClick={() => setViewId(u.id)}>
                          <Avatar name={u.full_name || u.email} />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 hover:text-indigo-700">
                              {u.full_name || '—'} {u.id === profile.id && <span className="text-xs text-slate-400">(you)</span>}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{u.phone || <span className="text-slate-400">No phone</span>}</div>
                        <div className="text-slate-500">{u.institution || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{s.total}</div>
                        <div className="text-xs text-slate-500">
                          {s.pending} pending · {s.approved} approved
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500" title={formatDate(u.created_at)}>
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setViewId(u.id)} title="View" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            <Icon name="eye" className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditUser(u)} title="Edit" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            <Icon name="edit" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(u)}
                            disabled={u.id === profile.id}
                            title={u.id === profile.id ? "You can't delete yourself" : 'Delete'}
                            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && <UserDetail user={viewing} onClose={() => setViewId(null)} onEdit={() => setEditUser(viewing)} onDelete={() => remove(viewing)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function UserDetail({ user, onClose, onEdit, onDelete }) {
  const { docs, openDoc, profile } = useDash()
  const mine = docs.filter((d) => d.user_id === user.id)
  return (
    <Modal title="User details" onClose={onClose} size="max-w-3xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user.full_name || user.email} size="h-16 w-16 text-xl" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900">{user.full_name || '—'}</h3>
            <RoleBadge role={user.role} />
          </div>
          <div className="mt-1 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <span className="flex items-center gap-2"><Icon name="mail" className="h-4 w-4 text-slate-400" /> {user.email}</span>
            <span className="flex items-center gap-2"><Icon name="phone" className="h-4 w-4 text-slate-400" /> {user.phone || '—'}</span>
            <span className="flex items-center gap-2"><Icon name="building" className="h-4 w-4 text-slate-400" /> {user.institution || '—'}</span>
            <span className="flex items-center gap-2"><Icon name="calendar" className="h-4 w-4 text-slate-400" /> Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onEdit}>
            <Icon name="edit" className="h-4 w-4" /> Edit
          </button>
          {user.id !== profile.id && (
            <button className="btn-danger" onClick={onDelete}>
              <Icon name="trash" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <h4 className="mt-6 mb-2 font-semibold text-slate-900">Documents ({mine.length})</h4>
      {mine.length ? (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {mine.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onClose()
                openDoc(d.id)
              }}
              className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{d.title}</div>
                <div className="text-xs text-slate-500">
                  v{d.current_version} · {timeAgo(d.updated_at)}
                </div>
              </div>
              <CategoryBadge category={d.category} />
              <StatusBadge status={d.status} />
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No documents uploaded yet.</p>
      )}
    </Modal>
  )
}

function EditUserModal({ user, onClose }) {
  const { reloadUsers, reloadDocs, profile, setProfile } = useDash()
  const { toast } = useFeedback()
  const [form, setForm] = useState({
    full_name: user.full_name ?? '',
    phone: user.phone ?? '',
    institution: user.institution ?? '',
    role: user.role,
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const isSelf = user.id === profile.id

  async function save() {
    setBusy(true)
    const patch = { full_name: form.full_name.trim(), phone: form.phone.trim() || null, institution: form.institution.trim() || null }
    if (!isSelf) patch.role = form.role
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
    setBusy(false)
    if (error) return toast(/column|permission/.test(error.message) ? 'Run supabase/upgrade_v2.sql in Supabase first.' : error.message, 'error')
    toast('User updated.')
    if (isSelf) setProfile({ ...profile, ...patch })
    reloadUsers()
    reloadDocs()
    onClose()
  }

  return (
    <Modal
      title="Edit user"
      subtitle={user.email}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.full_name} onChange={set('full_name')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">Institution</label>
            <input className="input" value={form.institution} onChange={set('institution')} />
          </div>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={set('role')} disabled={isSelf}>
            <option value="user">User — can upload and see own documents</option>
            <option value="admin">Admin — full access</option>
          </select>
          {isSelf && <p className="mt-1 text-xs text-slate-500">You can't change your own role.</p>}
        </div>
      </div>
    </Modal>
  )
}

function AddUserModal({ onClose }) {
  const { reloadUsers } = useDash()
  const { toast } = useFeedback()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', institution: '', role: 'user' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e?.preventDefault()
    if (!form.fullName || !form.email || form.password.length < 6) return toast('Name, email and a 6+ character password are required.', 'error')
    setBusy(true)
    try {
      await adminCreateUser(form)
      toast('User created. Share the email and password with them.')
      // profile row is created by a trigger; give it a moment
      setTimeout(reloadUsers, 600)
      onClose()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Add new user"
      subtitle="Creates an account that can sign in immediately."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Creating…' : 'Create user'}</button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Full name *</label>
          <input className="input" value={form.fullName} onChange={set('fullName')} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input className="input" type="text" value={form.password} onChange={set('password')} minLength={6} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">Institution</label>
            <input className="input" value={form.institution} onChange={set('institution')} />
          </div>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </form>
    </Modal>
  )
}
