import { useDash } from './DashboardLayout'
import { Link } from '../../lib/router'
import { CATEGORIES, STATUS } from '../../lib/supabase'
import { StatusBadge, CategoryBadge, Avatar, Empty, timeAgo } from '../../components/ui'
import Icon from '../../components/icons'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Stat({ label, value, icon, tone, to, hint }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <Link to={to} className="card group flex items-start justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} />
      </span>
    </Link>
  )
}

function DocRow({ d, showOwner, onOpen }) {
  return (
    <button onClick={() => onOpen(d.id)} className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
      {showOwner ? <Avatar name={d.owner?.full_name || '?'} /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon name="docs" className="h-4 w-4" /></span>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800">{d.title}</div>
        <div className="truncate text-xs text-slate-500">
          {showOwner ? `${d.owner?.full_name ?? 'Unknown'} · ` : ''}v{d.current_version} · {timeAgo(d.updated_at)}
        </div>
      </div>
      <StatusBadge status={d.status} />
    </button>
  )
}

export default function Overview() {
  const { profile, isAdmin, docs, users, unread, openDoc, docsLoading } = useDash()
  const count = (s) => docs.filter((d) => d.status === s).length
  const total = docs.length || 1
  const firstName = (profile.full_name || '').split(' ')[0]

  const queue = isAdmin
    ? docs.filter((d) => d.status === 'pending').sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at)).slice(0, 6)
    : docs.filter((d) => d.status === 'needs_changes').slice(0, 6)
  const recent = docs.slice(0, 6)

  const newUsers = users.filter((u) => Date.now() - new Date(u.created_at) < 30 * 864e5).length

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 p-6 text-white sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {greeting()}, {firstName || 'there'} 👋
          </h2>
          <p className="mt-1 text-indigo-100">
            {isAdmin
              ? count('pending')
                ? `You have ${count('pending')} document${count('pending') > 1 ? 's' : ''} waiting for review.`
                : 'All caught up — no documents waiting for review.'
              : count('needs_changes')
                ? `${count('needs_changes')} document${count('needs_changes') > 1 ? 's need' : ' needs'} your changes.`
                : 'Upload a document and track its review here.'}
          </p>
        </div>
        <Link
          to={isAdmin ? '/dashboard/documents' : '/dashboard/upload'}
          className="btn shrink-0 bg-white text-indigo-700 hover:bg-indigo-50"
        >
          {isAdmin ? 'Open review queue' : 'Upload document'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin ? (
          <>
            <Stat label="Total documents" value={docs.length} icon="docs" tone="indigo" to="/dashboard/documents" />
            <Stat label="Waiting for review" value={count('pending')} icon="clock" tone="amber" to="/dashboard/documents" />
            <Stat label="Registered users" value={users.length} icon="users" tone="sky" to="/dashboard/users" hint={`${newUsers} new in last 30 days`} />
            <Stat label="Unread messages" value={unread} icon="mail" tone="rose" to="/dashboard/messages" />
          </>
        ) : (
          <>
            <Stat label="My documents" value={docs.length} icon="docs" tone="indigo" to="/dashboard/documents" />
            <Stat label="Under review" value={count('pending')} icon="clock" tone="amber" to="/dashboard/documents" />
            <Stat label="Changes requested" value={count('needs_changes')} icon="alert" tone="orange" to="/dashboard/documents" />
            <Stat label="Approved" value={count('approved')} icon="check" tone="emerald" to="/dashboard/documents" />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Queue / action needed */}
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">{isAdmin ? 'Review queue' : 'Action needed'}</h3>
              <p className="text-xs text-slate-500">{isAdmin ? 'Oldest pending documents first' : 'Documents where the reviewer requested changes'}</p>
            </div>
            <Link to="/dashboard/documents" className="text-sm font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {docsLoading ? (
            <Empty title="Loading…" />
          ) : queue.length ? (
            <div className="divide-y divide-slate-100">
              {queue.map((d) => (
                <DocRow key={d.id} d={d} showOwner={isAdmin} onOpen={openDoc} />
              ))}
            </div>
          ) : (
            <Empty
              icon={<span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" /></span>}
              title="You're all caught up"
            >
              {isAdmin ? 'No documents are waiting for review.' : 'No documents need changes right now.'}
            </Empty>
          )}
        </div>

        {/* Breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">Status breakdown</h3>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {[['pending', 'bg-amber-400'], ['needs_changes', 'bg-orange-500'], ['approved', 'bg-emerald-500'], ['rejected', 'bg-rose-500']].map(([s, c]) => (
              <div key={s} className={c} style={{ width: `${(count(s) / total) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {Object.entries(STATUS).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-sm">
                <StatusBadge status={k} />
                <span className="font-medium text-slate-700">{count(k)}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 font-semibold text-slate-900">By article type</h3>
          <ul className="mt-3 space-y-2.5">
            {Object.entries(CATEGORIES).map(([k]) => {
              const n = docs.filter((d) => (d.category ?? 'original_article') === k).length
              return (
                <li key={k} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0">
                    <CategoryBadge category={k} />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(n / total) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right font-medium text-slate-700">{n}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Recent activity</h3>
          <Link to="/dashboard/documents" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {recent.length ? (
          <div className="divide-y divide-slate-100">
            {recent.map((d) => (
              <DocRow key={d.id} d={d} showOwner={isAdmin} onOpen={openDoc} />
            ))}
          </div>
        ) : (
          <Empty title="No documents yet" action={<Link to="/dashboard/upload" className="btn-primary">Upload your first document</Link>} />
        )}
      </div>
    </div>
  )
}
