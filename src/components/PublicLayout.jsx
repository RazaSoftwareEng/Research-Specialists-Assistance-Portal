import { useState } from 'react'
import { Link } from '../lib/router'
import { APP_NAME, APP_SUBTITLE, APP_FULL_NAME, APP_INITIALS, LEAD } from '../lib/brand'

const NAV = [
  ['/', 'Home'],
  ['/submit-flow', 'Submit Flow'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

export function Logo({ light }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2" title={APP_FULL_NAME}>
      <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wide text-white">
        {APP_INITIALS}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate font-semibold ${light ? 'text-white' : 'text-slate-800'}`}>{APP_NAME}</span>
        <span className={`hidden truncate text-xs lg:block ${light ? 'text-slate-400' : 'text-slate-500'}`}>{APP_SUBTITLE}</span>
      </span>
    </Link>
  )
}

export default function PublicLayout({ route, session, children }) {
  const [open, setOpen] = useState(false)
  const cta = session ? ['/dashboard', 'Dashboard'] : ['/login', 'Login / Sign up']

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  route === to ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to={cta[0]} className="btn-primary ml-2">
              {cta[1]}
            </Link>
          </nav>
          <button
            className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
          </button>
        </div>
        {open && (
          <nav className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
            {NAV.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  route === to ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link to={cta[0]} className="btn-primary mt-2 w-full">
              {cta[1]}
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-3">
            <Logo light />
            <p className="text-sm text-slate-400">
              Expert guidance and review for original articles, reviews and clinical trial documents.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Pages</h4>
            <ul className="space-y-2 text-sm">
              {NAV.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Led by</h4>
            <p className="text-sm">{LEAD.name}</p>
            <Link to={cta[0]} className="btn-primary mt-4">
              {session ? 'Go to dashboard' : 'Submit a document'}
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_FULL_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

/** Shared page hero for inner pages */
export function PageHero({ eyebrow, title, text }) {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-20">
        {eyebrow && <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">{eyebrow}</div>}
        <h1 className="mx-auto max-w-3xl text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
        {text && <p className="mx-auto mt-4 max-w-2xl text-slate-600">{text}</p>}
      </div>
    </section>
  )
}
