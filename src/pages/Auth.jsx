import { useState } from 'react'
import { supabase, getRemember, setRemember } from '../lib/supabase'
import { Alert } from '../components/ui'
import { Link } from '../lib/router'
import { APP_NAME, APP_SUBTITLE, APP_INITIALS } from '../lib/brand'

const EMAIL_KEY = 'df_saved_email'
const savedEmail = () => {
  try { return localStorage.getItem(EMAIL_KEY) || '' } catch { return '' }
}

export default function Auth() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: savedEmail(), password: '' })
  const [remember, setRememberState] = useState(getRemember())
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    // Must be set BEFORE signing in so the session goes to the right storage
    setRemember(remember)
    try {
      if (remember) localStorage.setItem(EMAIL_KEY, form.email)
      else localStorage.removeItem(EMAIL_KEY)
    } catch {}

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName } },
        })
        if (error) throw error
        // With "Confirm email" turned OFF in Supabase, a session is returned and the
        // app opens the dashboard automatically.
        if (!data.session) {
          setInfo('Account created, but Supabase "Confirm email" is still ON. Turn it off in Supabase → Authentication → Sign In / Providers → Email.')
        }
      }
    } catch (err) {
      setError(
        /email not confirmed/i.test(err.message)
          ? 'This email is not confirmed yet. Ask the admin to confirm it, or turn off "Confirm email" in Supabase.'
          : /email address .* is invalid/i.test(err.message)
            ? `${err.message}. Supabase rejected this address. Turn off "Confirm email" in Supabase (Authentication → Sign In / Providers → Email) or use a real email address.`
          : /invalid login credentials/i.test(err.message)
            ? 'Wrong email or password.'
            : err.message
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
      <Link to="/" className="mb-4 inline-block text-sm font-medium text-slate-600 hover:text-indigo-700">
        ← Back to website
      </Link>
      <div className="card w-full p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-14 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold tracking-wide text-white">
            {APP_INITIALS}
          </div>
          <h1 className="text-xl leading-tight font-semibold text-slate-800">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-600">{APP_SUBTITLE}</p>
          <p className="mt-2 text-xs text-slate-400">Upload, review and approve research documents</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm">
          {['signin', 'signup'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setError('')
                setInfo('')
              }}
              className={`cursor-pointer rounded-md py-2 font-medium ${mode === m ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">Full name</label>
              <input className="input" required autoComplete="name" value={form.fullName} onChange={set('fullName')} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-16"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-2 cursor-pointer px-2 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
              checked={remember}
              onChange={(e) => setRememberState(e.target.checked)}
            />
            Remember me
          </label>

          <Alert>{error}</Alert>
          <Alert type="success">{info}</Alert>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
