import { Link } from '../../lib/router'
import { APP_NAME, APP_SUBTITLE, LEAD } from '../../lib/brand'

const Svg = ({ d, className = 'h-6 w-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export const SERVICES = [
  {
    title: 'Original Articles',
    text: 'Structure, clarity and completeness checks for your research manuscript — from introduction and methods to results and discussion.',
    icon: 'M9 12h6m-6 4h6M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    title: 'Reviews',
    text: 'Guidance on narrative and systematic reviews: scope, literature coverage, organisation of evidence and well-supported conclusions.',
    icon: 'M4 6h16M4 10h16M4 14h10M4 18h7',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    title: 'Clinical Trials',
    text: 'Review of protocols, reports and supporting documents for clear objectives, methodology and consistent reporting.',
    icon: 'M9 3v6L4 18a2 2 0 002 3h12a2 2 0 002-3l-5-9V3M8 3h8M7 15h10',
    color: 'bg-emerald-100 text-emerald-700',
  },
]

const STEPS = [
  ['Create an account', 'Sign up in under a minute.'],
  ['Upload your document', 'PDF, Word or images.'],
  ['Get expert notes', 'Clear suggestions on what to improve.'],
  ['Revise & get approved', 'Upload new versions until approved.'],
]

const FEATURES = [
  ['Private & secure', 'Your files are stored privately. Only you and the review team can see them.', 'M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z'],
  ['Clear feedback', 'Every note is saved with the version it refers to, so nothing gets lost.', 'M8 10h8M8 14h5M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z'],
  ['Version history', 'Every upload is kept — compare and download any previous version.', 'M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  ['Live status', 'Always know where your document stands: pending, changes requested or approved.', 'M5 13l4 4L19 7'],
]

export default function Home({ session }) {
  const start = session ? '/dashboard' : '/login'
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Led by {LEAD.name}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">{APP_NAME}</h1>
            <p className="mt-2 text-lg font-medium text-indigo-700">{APP_SUBTITLE}</p>
            <p className="mt-5 max-w-xl text-slate-600">
              Submit your manuscript, receive clear and actionable feedback, revise, and resubmit — all in one simple,
              secure place. We help researchers present their work with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={start} className="btn-primary px-6 py-3 text-base">
                Submit your document
              </Link>
              <Link to="/submit-flow" className="btn-secondary px-6 py-3 text-base">
                See how it works
              </Link>
            </div>
          </div>

          {/* Illustration: mini review card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-3xl bg-indigo-200/40 blur-2xl" />
            <div className="card relative space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-[10px] font-bold text-rose-700">PDF</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">Clinical_Trial_Protocol.pdf</div>
                  <div className="text-xs text-slate-500">v2 · uploaded today</div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">In review</span>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-slate-700">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-700">Reviewer note</div>
                Please clarify the inclusion criteria and add the sample size calculation in section 3.
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {['Uploaded', 'Reviewed', 'Revised', 'Approved'].map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center gap-1">
                    <span className={`h-2 w-full rounded-full ${i < 3 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">What we help with</div>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Our areas of assistance</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-md">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <Svg d={s.icon} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Simple process</div>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">How it works</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t} className="card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/submit-flow" className="font-medium text-indigo-700 hover:underline">
              Read the full submission flow →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([t, d, icon]) => (
            <div key={t}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Svg d={icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-2xl bg-indigo-600 px-6 py-12 text-center text-white md:px-12">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to improve your manuscript?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Create a free account, upload your document and get reviewed by {LEAD.name} and the team.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={start} className="btn bg-white px-6 py-3 text-base text-indigo-700 hover:bg-indigo-50">
              Get started
            </Link>
            <Link to="/contact" className="btn border border-indigo-300 px-6 py-3 text-base text-white hover:bg-indigo-500">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
