import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import { useRoute, navigate, Link } from './lib/router'
import Auth from './pages/Auth'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Documents from './pages/dashboard/Documents'
import UploadPage from './pages/dashboard/Upload'
import Users from './pages/dashboard/Users'
import Messages from './pages/dashboard/Messages'
import ProfilePage from './pages/dashboard/Profile'
import PublicLayout from './components/PublicLayout'
import Home from './pages/public/Home'
import SubmitFlow from './pages/public/SubmitFlow'
import About from './pages/public/About'
import Contact from './pages/public/Contact'

const PUBLIC_PAGES = {
  '/': Home,
  '/submit-flow': SubmitFlow,
  '/about': About,
  '/contact': Contact,
}

const DASH_PAGES = {
  '/dashboard': Overview,
  '/dashboard/documents': Documents,
  '/dashboard/upload': UploadPage,
  '/dashboard/users': Users,
  '/dashboard/messages': Messages,
  '/dashboard/profile': ProfilePage,
}
const ADMIN_ONLY = ['/dashboard/users', '/dashboard/messages']

export default function App() {
  const route = useRoute()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) return setLoading(false)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data ?? { id: session.user.id, email: session.user.email, role: 'user' })
        setLoading(false)
      })
  }, [session?.user?.id])

  // Logged-in users visiting /login go to their dashboard
  useEffect(() => {
    if (session && route === '/login') navigate('/dashboard')
  }, [session, route])

  // ---------- Public website ----------
  const Page = PUBLIC_PAGES[route]
  if (Page) {
    return (
      <PublicLayout route={route} session={session}>
        <Page session={session} />
      </PublicLayout>
    )
  }

  if (route !== '/login' && !DASH_PAGES[route]) {
    return (
      <PublicLayout route={route} session={session}>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <div className="text-6xl font-bold text-indigo-600">404</div>
          <p className="mt-3 text-slate-600">This page does not exist.</p>
          <Link to="/" className="btn-primary mt-6">
            Back to home
          </Link>
        </div>
      </PublicLayout>
    )
  }

  // ---------- App (login / dashboard) ----------
  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-lg p-6">
          <h1 className="mb-2 text-lg font-semibold">Supabase is not configured</h1>
          <p className="text-sm text-slate-600">
            Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to{' '}
            <code className="rounded bg-slate-100 px-1">.env</code>, add your project URL and key, then restart{' '}
            <code className="rounded bg-slate-100 px-1">npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
  }

  if (!session) return <Auth />

  if (!profile) return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>

  const isAdmin = profile.role === 'admin'
  const dashRoute = DASH_PAGES[route] && (isAdmin || !ADMIN_ONLY.includes(route)) ? route : '/dashboard'
  const DashPage = DASH_PAGES[dashRoute]

  return (
    <DashboardLayout key={profile.id + profile.role} route={dashRoute} profile={profile} setProfile={setProfile}>
      <DashPage />
    </DashboardLayout>
  )
}
