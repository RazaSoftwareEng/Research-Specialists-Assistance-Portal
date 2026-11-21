import { Link } from '../../lib/router'
import { PageHero } from '../../components/PublicLayout'
import { APP_FULL_NAME, LEAD } from '../../lib/brand'
import { SERVICES } from './Home'

const VALUES = [
  ['Clarity', 'Feedback that is specific and easy to act on — you always know what to change and why.'],
  ['Confidentiality', 'Your unpublished work stays private. Only you and the review team can access it.'],
  ['Rigour', 'Attention to structure, methodology and consistency in every document we review.'],
  ['Support', 'We stay with you through every revision until your document is ready.'],
]

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Helping researchers present their best work"
        text={`${APP_FULL_NAME} supports authors through a clear review-and-revise process for their research documents.`}
      />

      {/* Lead */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card grid items-center gap-8 p-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-4xl font-bold text-white shadow-lg">
              {LEAD.initials}
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{LEAD.name}</h2>
            <span className="mt-1 rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-700">{LEAD.role}</span>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Meet our lead</div>
            <p className="mt-3 text-lg leading-relaxed text-slate-700">{LEAD.bio}</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Our mission</div>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Clear guidance, from draft to approval</h2>
            <p className="mt-4 text-slate-600">
              Writing research is hard — making it clear, complete and well-structured is even harder. Our mission is to
              give researchers a simple place to submit their work, receive thoughtful feedback, and improve it step by
              step.
            </p>
            <p className="mt-3 text-slate-600">
              Every submission is tracked with full version history and notes, so you can see exactly how your document
              has improved over time.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(([t, d]) => (
              <div key={t} className="card p-5">
                <h3 className="font-semibold text-slate-900">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-slate-900">What we assist with</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border-t-4 border-indigo-500 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/contact" className="btn-primary px-6 py-3 text-base">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  )
}
