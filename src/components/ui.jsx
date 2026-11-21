import { STATUS, CATEGORIES, fileKind } from '../lib/supabase'

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-slate-100 text-slate-700' }
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export function CategoryBadge({ category }) {
  const c = CATEGORIES[category] ?? CATEGORIES.other
  return <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.label}</span>
}

export function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Admin</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">User</span>
  )
}

const AVATAR_COLORS = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500']

export function Avatar({ name = '?', size = 'h-9 w-9 text-sm' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'
  const color = AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color} ${size}`}>
      {initials}
    </span>
  )
}

export function FileIcon({ name }) {
  const kind = fileKind(name)
  const map = {
    pdf: ['PDF', 'bg-rose-100 text-rose-700'],
    word: ['DOC', 'bg-blue-100 text-blue-700'],
    image: ['IMG', 'bg-emerald-100 text-emerald-700'],
    other: ['FILE', 'bg-slate-100 text-slate-700'],
  }
  const [label, cls] = map[kind]
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  )
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  const cls = type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>
}

export function Empty({ icon, title = 'Nothing here yet', children, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      {icon}
      <div className="mt-3 font-medium text-slate-700">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-slate-500">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`
  return new Date(date).toLocaleDateString()
}
