import { useState } from 'react'
import { supabase, isConfigured } from '../../lib/supabase'
import { PageHero } from '../../components/PublicLayout'
import { Alert } from '../../components/ui'
import { CONTACT, LEAD } from '../../lib/brand'

const SUBJECTS = ['General question', 'Original article', 'Review', 'Clinical trial', 'Technical help', 'Other']

const Svg = ({ d }) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export default function Contact() {
  const empty = { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' }
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!isConfigured) return setError('The website is not connected to the server yet.')
    setBusy(true)
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject,
      message: form.message.trim(),
    })
    setBusy(false)
    if (error) return setError(error.message)
    setSent(true)
    setForm(empty)
  }

  const info = [
    CONTACT.email && ['Email', CONTACT.email, `mailto:${CONTACT.email}`, 'M4 6h16v12H4zM4 6l8 7 8-7'],
    CONTACT.phone && ['Phone', CONTACT.phone, `tel:${CONTACT.phone.replace(/\s/g, '')}`, 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z'],
    CONTACT.whatsapp && ['WhatsApp', CONTACT.whatsapp, `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`, 'M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z'],
    CONTACT.address && ['Address', CONTACT.address, null, 'M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z'],
    CONTACT.hours && ['Working hours', CONTACT.hours, null, 'M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  ].filter(Boolean)

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        text="Have a question about a submission or our services? Send us a message and we'll get back to you."
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-3">
        {/* Info */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 font-bold text-white">
                {LEAD.initials}
              </span>
              <div>
                <div className="font-semibold text-slate-900">{LEAD.name}</div>
                <div className="text-sm text-slate-500">{LEAD.role}</div>
              </div>
            </div>
          </div>
          {info.map(([label, value, href, icon]) => (
            <div key={label} className="card flex items-start gap-3 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Svg d={icon} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
                {href ? (
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="break-words font-medium text-indigo-700 hover:underline">
                    {value}
                  </a>
                ) : (
                  <div className="break-words font-medium text-slate-800">{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="card p-6 md:p-8 lg:col-span-2">
          {sent ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Message sent!</h2>
              <p className="mt-2 text-slate-600">Thank you for reaching out. We will reply to your email soon.</p>
              <button className="btn-secondary mt-6" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Send a message</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name *</label>
                  <input className="input" required maxLength={120} value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" required maxLength={200} value={form.email} onChange={set('email')} />
                </div>
                <div>
                  <label className="label">Phone (optional)</label>
                  <input className="input" type="tel" maxLength={40} value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input" value={form.subject} onChange={set('subject')}>
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input min-h-36"
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="Tell us briefly about your document or question…"
                  value={form.message}
                  onChange={set('message')}
                />
              </div>
              <Alert>{error}</Alert>
              <button className="btn-primary w-full sm:w-auto sm:px-8" disabled={busy}>
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
