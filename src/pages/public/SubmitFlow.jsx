import { useState } from 'react'
import { Link } from '../../lib/router'
import { PageHero } from '../../components/PublicLayout'
import { StatusBadge } from '../../components/ui'

const STEPS = [
  {
    title: 'Create your account',
    text: 'Click "Login / Sign up", enter your name, email and a password. You go straight to your personal dashboard.',
  },
  {
    title: 'Upload your document',
    text: 'On the dashboard, drag your file into the upload box (or click to choose it), add a title and a short description, then press "Upload document".',
  },
  {
    title: 'Review by our team',
    text: 'Your document appears as "Pending review". The reviewer reads it in full and writes notes on what can be improved.',
  },
  {
    title: 'Read the feedback',
    text: 'If changes are needed, the status changes to "Changes requested". Open the document to see the notes under "What to change".',
  },
  {
    title: 'Revise and re-upload',
    text: 'Make the changes in your file and upload it from the same document window. It is saved as a new version (v2, v3 …) and goes back for review.',
  },
  {
    title: 'Approval',
    text: 'When everything is in order, the document is marked "Approved". All versions and notes stay in your dashboard for future reference.',
  },
]

const FILES = [
  ['PDF', '.pdf', 'bg-rose-100 text-rose-700'],
  ['Word', '.doc, .docx', 'bg-blue-100 text-blue-700'],
  ['Images', '.jpg, .png, .webp, .gif', 'bg-emerald-100 text-emerald-700'],
]

const FAQ = [
  ['Is there a file size limit?', 'Yes, each file can be up to 20 MB. For larger documents, compress images inside the file or export as PDF.'],
  ['Who can see my documents?', 'Only you and the review team. Files are stored in a private, secure storage and are never public.'],
  ['Can I upload a document that was already reviewed?', 'Yes. Open the document and upload the updated file — it is saved as a new version and sent for review again.'],
  ['What file is best for review?', 'Word (.docx) or PDF. Both can be previewed directly in the browser by the reviewer.'],
  ['Can I delete a document?', 'Yes, open it and click "Delete document" at the bottom. This removes all its versions permanently.'],
]

export default function SubmitFlow({ session }) {
  const [open, setOpen] = useState(0)
  return (
    <>
      <PageHero
        eyebrow="Submit Flow"
        title="How to submit your document"
        text="A simple, transparent process from first upload to final approval. Follow the steps below."
      />

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <ol className="relative space-y-8 border-l-2 border-indigo-100 pl-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="absolute -left-[49px] flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ring-4 ring-white">
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Status + files */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900">What the status means</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3"><StatusBadge status="pending" /> <span>Your document is waiting for the reviewer.</span></li>
              <li className="flex items-start gap-3"><StatusBadge status="needs_changes" /> <span>Read the notes, update your file and upload a new version.</span></li>
              <li className="flex items-start gap-3"><StatusBadge status="approved" /> <span>All done — no further action needed.</span></li>
              <li className="flex items-start gap-3"><StatusBadge status="rejected" /> <span>Not accepted in this form. See notes for the reason; you may upload a revised version.</span></li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900">Accepted files</h3>
            <ul className="mt-4 space-y-3">
              {FILES.map(([n, ext, cls]) => (
                <li key={n} className="flex items-center gap-3">
                  <span className={`flex h-9 w-14 items-center justify-center rounded-lg text-xs font-bold ${cls}`}>{n}</span>
                  <span className="text-sm text-slate-600">{ext}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
              Maximum 20 MB per file. Tip: use .docx or PDF for the best in-browser preview.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-medium text-slate-800 hover:bg-slate-50"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                <span className={`text-xl text-slate-400 transition ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-slate-600">{a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to={session ? '/dashboard' : '/login'} className="btn-primary px-6 py-3 text-base">
            Start your submission
          </Link>
        </div>
      </section>
    </>
  )
}
