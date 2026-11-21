import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, navigate } from '../../lib/router'
import { APP_NAME, APP_INITIALS, APP_FULL_NAME } from '../../lib/brand'
import { Avatar, RoleBadge } from '../../components/ui'
import Icon from '../../components/icons'
import DocumentModal from '../../components/DocumentModal'
import EditDocumentModal from '../../components/EditDocumentModal'

const DashCtx = createContext(null)
export const useDash = () => useContext(DashCtx)

export default function DashboardLayout({ route, profile, setProfile, children }) {
  const isAdmin = profile.role === 'admin'
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [unread, setUnread] = useState(0)
  const [openDocId, setOpenDocId] = useState(null)
  const [editDocId, setEditDocId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const reloadDocs = useCallback(async () => {
    let q = supabase
      .from('documents')
      .select(isAdmin ? '*, owner:profiles(id, full_name, email)' : '*')
      .order('updated_at', { ascending: false })
    if (!isAdmin) q = q.eq('user_id', profile.id)
    const { data } = await q
    setDocs(data ?? [])
    setDocsLoading(false)
  }, [isAdmin, profile.id])

  const reloadUsers = useCallback(async () => {
    if (!isAdmin) return
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data ?? [])
  }, [isAdmin])

  const reloadUnread = useCallback(async () => {
    if (!isAdmin) return
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
    setUnread(count ?? 0)
  }, [isAdmin])

  useEffect(() => {
    reloadDocs()
    reloadUsers()
    reloadUnread()
  }, [reloadDocs, reloadUsers, reloadUnread])

  // Close the mobile menu when the page changes
  useEffect(() => setMobileOpen(false), [route])

  const count = (s) => docs.filter((d) => d.status === s).length
  const nav = isAdmin
    ? [
        ['/dashboard', 'Overview', 'home'],
        ['/dashboard/documents', 'All documents', 'docs', count('pending')],
        ['/dashboard/upload', 'Upload', 'upload'],
        ['/dashboard/users', 'Users', 'users'],
        ['/dashboard/messages', 'Messages', 'mail', unread],
        ['/dashboard/profile', 'My profile', 'user'],
      ]
    : [
        ['/dashboard', 'Overview', 'home'],
        ['/dashboard/documents', 'My documents', 'docs', count('needs_changes')],
        ['/dashboard/upload', 'Upload document', 'upload'],
        ['/dashboard/profile', 'My profile', 'user'],
      ]
  const current = nav.find(([to]) => to === route) ?? nav[0]

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const ctx = {
    profile,
    setProfile,
    isAdmin,
    docs,
    docsLoading,
    reloadDocs,
    users,
    reloadUsers,
    unread,
    setUnread,
    openDoc: setOpenDocId,
    editDoc: setEditDocId,
  }

  const openDoc = docs.find((d) => d.id === openDocId)
  const editDoc = docs.find((d) => d.id === editDocId)

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <Link to="/" className="flex items-center gap-3 border-b border-slate-800 px-5 py-4" title={APP_FULL_NAME}>
        <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wide text-white">
          {APP_INITIALS}
        </span>
        <span className="text-sm leading-tight font-semibold text-white">{APP_NAME}</span>
      </Link>

      <div className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {isAdmin ? 'Admin panel' : 'Menu'}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map(([to, label, icon, badge]) => {
          const active = to === current[0]
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-indigo-600 text-white shadow' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon name={icon} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-indigo-500 text-white'}`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-800 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-800 hover:text-white">
          <Icon name="globe" /> Visit website
        </Link>
        <button onClick={signOut} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-800 hover:text-white">
          <Icon name="logout" /> Sign out
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-800/60 p-3">
          <Avatar name={profile.full_name || profile.email} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{profile.full_name || 'User'}</div>
            <div className="truncate text-xs text-slate-400">{profile.email}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashCtx.Provider value={ctx}>
      <div className="min-h-screen bg-slate-50">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</aside>
          </div>
        )}

        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <button className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Icon name="menu" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500">{isAdmin ? 'Admin' : 'Dashboard'}</div>
              <h1 className="truncate text-lg font-semibold text-slate-900">{current[1]}</h1>
            </div>
            <Link to="/dashboard/upload" className="btn-primary hidden sm:inline-flex">
              <Icon name="plus" className="h-4 w-4" /> New document
            </Link>
            <UserMenu profile={profile} onSignOut={signOut} />
          </header>

          <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
        </div>
      </div>

      {openDoc && (
        <DocumentModal doc={openDoc} profile={profile} onClose={() => setOpenDocId(null)} onChanged={reloadDocs} onEdit={() => setEditDocId(openDoc.id)} />
      )}
      {editDoc && <EditDocumentModal doc={editDoc} onClose={() => setEditDocId(null)} />}
    </DashCtx.Provider>
  )
}

function UserMenu({ profile, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-2 rounded-full p-1 pr-2 hover:bg-slate-100">
        <Avatar name={profile.full_name || profile.email} size="h-8 w-8 text-xs" />
        <Icon name="chevronDown" className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <div className="card absolute right-0 mt-2 w-60 overflow-hidden py-1 shadow-lg" onClick={() => setOpen(false)}>
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="truncate text-sm font-medium text-slate-900">{profile.full_name}</div>
            <div className="truncate text-xs text-slate-500">{profile.email}</div>
            <div className="mt-2">
              <RoleBadge role={profile.role} />
            </div>
          </div>
          <Link to="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Icon name="user" className="h-4 w-4" /> My profile
          </Link>
          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <Icon name="globe" className="h-4 w-4" /> Website
          </Link>
          <button onClick={onSignOut} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
