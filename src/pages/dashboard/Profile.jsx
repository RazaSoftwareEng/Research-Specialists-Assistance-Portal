import { useState } from 'react'
import { useDash } from './DashboardLayout'
import { supabase, formatDate } from '../../lib/supabase'
import { Avatar, RoleBadge } from '../../components/ui'
import { useFeedback } from '../../components/feedback'

export default function Profile() {
  const { profile, setProfile, docs } = useDash()
  const { toast } = useFeedback()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    institution: profile.institution ?? '',
  })
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [busy, setBusy] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function saveProfile(e) {
    e.preventDefault()
    setBusy('profile')
    const patch = { full_name: form.full_name.trim(), phone: form.phone.trim() || null, institution: form.institution.trim() || null }
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
    setBusy('')
    if (error) return toast(/column|permission/.test(error.message) ? 'Run supabase/upgrade_v2.sql in Supabase first.' : error.message, 'error')
    setProfile({ ...profile, ...patch })
    toast('Profile saved.')
  }

  async function changePassword(e) {
    e.preventDefault()
    if (pw.next.length < 6) return toast('Password must be at least 6 characters.', 'error')
    if (pw.next !== pw.confirm) return toast('Passwords do not match.', 'error')
    setBusy('pw')
    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setBusy('')
    if (error) return toast(error.message, 'error')
    setPw({ next: '', confirm: '' })
    toast('Password changed.')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card h-fit p-6 text-center">
        <div className="flex justify-center">
          <Avatar name={profile.full_name || profile.email} size="h-20 w-20 text-2xl" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{profile.full_name || '—'}</h2>
        <p className="text-sm text-slate-500">{profile.email}</p>
        <div className="mt-3">
          <RoleBadge role={profile.role} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-sm">
          <div>
            <div className="text-xl font-bold text-slate-900">{docs.length}</div>
            <div className="text-slate-500">{profile.role === 'admin' ? 'Total docs' : 'Documents'}</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{docs.filter((d) => d.status === 'approved').length}</div>
            <div className="text-slate-500">Approved</div>
          </div>
        </div>
        {profile.created_at && <p className="mt-5 text-xs text-slate-400">Member since {formatDate(profile.created_at)}</p>}
      </div>

      <div className="space-y-6 lg:col-span-2">
        <form onSubmit={saveProfile} className="card p-6">
          <h3 className="font-semibold text-slate-900">Personal information</h3>
          <p className="mb-5 text-sm text-slate-500">This is shown to the review team.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Full name</label>
              <input className="input" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-slate-50 text-slate-500" value={profile.email} disabled />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+92 …" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Institution / Organisation</label>
              <input className="input" value={form.institution} onChange={set('institution')} placeholder="University, hospital or company" />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" disabled={busy === 'profile'}>
              {busy === 'profile' ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <form onSubmit={changePassword} className="card p-6">
          <h3 className="font-semibold text-slate-900">Change password</h3>
          <p className="mb-5 text-sm text-slate-500">Use at least 6 characters.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" disabled={busy === 'pw' || !pw.next}>
              {busy === 'pw' ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
