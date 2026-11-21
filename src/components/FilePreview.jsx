import { useEffect, useRef, useState } from 'react'
import { signedUrl, fileKind, formatSize, formatDate } from '../lib/supabase'
import { FileIcon } from './ui'

const Icon = ({ d, className = 'h-4 w-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const I = {
  zoomIn: 'M21 21l-4.35-4.35M11 8v6M8 11h6m5 0a8 8 0 11-16 0 8 8 0 0116 0z',
  zoomOut: 'M21 21l-4.35-4.35M8 11h6m5 0a8 8 0 11-16 0 8 8 0 0116 0z',
  rotate: 'M4 4v5h5M20 20v-5h-5M5.6 15a7 7 0 0011.9 2.3M18.4 9A7 7 0 006.5 6.7',
  expand: 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  download: 'M12 4v12m0 0l-4-4m4 4l4-4M4 20h16',
}

function ToolButton({ icon, title, onClick, active }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded-md p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 ${active ? 'bg-slate-200' : ''}`}
    >
      <Icon d={icon} />
    </button>
  )
}

function Spinner({ label = 'Loading preview…' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      {label}
    </div>
  )
}

export default function FilePreview({ version, isLatest }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [full, setFull] = useState(false)
  const [docxState, setDocxState] = useState('idle') // idle | loading | done | error
  const docxRef = useRef(null)

  const kind = fileKind(version.file_name)
  const isDocx = version.file_name.toLowerCase().endsWith('.docx')

  // Fresh signed URL whenever the version changes
  useEffect(() => {
    setUrl('')
    setError('')
    setZoom(1)
    setRotate(0)
    setDocxState('idle')
    signedUrl(version.file_path).then(setUrl).catch((e) => setError(e.message))
  }, [version.id])

  // Render .docx in the browser
  useEffect(() => {
    if (!url || kind !== 'word' || !isDocx || !docxRef.current) return
    let cancelled = false
    setDocxState('loading')
    ;(async () => {
      try {
        const [{ renderAsync }, blob] = await Promise.all([
          import('docx-preview'),
          fetch(url).then((r) => {
            if (!r.ok) throw new Error('Could not load file')
            return r.blob()
          }),
        ])
        if (cancelled || !docxRef.current) return
        docxRef.current.innerHTML = ''
        await renderAsync(blob, docxRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
        })
        if (!cancelled) setDocxState('done')
      } catch {
        if (!cancelled) setDocxState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url, isDocx, kind])

  // Esc leaves full screen (before the modal's own Esc handler closes the modal)
  useEffect(() => {
    if (!full) return
    const h = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        setFull(false)
      }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [full])

  const download = async () => {
    try {
      window.open(await signedUrl(version.file_path, true), '_blank')
    } catch (e) {
      setError(e.message)
    }
  }

  const fallback = (msg) => (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <FileIcon name={version.file_name} />
      <p className="mt-3 max-w-sm text-sm text-slate-600">{msg}</p>
      <button className="btn-primary mt-4" onClick={download}>
        <Icon d={I.download} /> Download file
      </button>
    </div>
  )

  let body
  if (error) body = fallback(`Preview failed: ${error}`)
  else if (!url) body = <Spinner />
  else if (kind === 'image')
    body = (
      <div className="flex h-full items-center justify-center overflow-auto p-4">
        <img
          src={url}
          alt={version.file_name}
          style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
          className="max-h-full max-w-full rounded object-contain shadow-md transition-transform duration-200"
        />
      </div>
    )
  else if (kind === 'pdf') body = <iframe src={`${url}#view=FitH`} title={version.file_name} className="h-full w-full" />
  else if (kind === 'word' && isDocx)
    body = (
      <div className="relative h-full overflow-auto">
        {docxState === 'loading' && (
          <div className="absolute inset-0 z-10 bg-slate-100">
            <Spinner label="Opening Word document…" />
          </div>
        )}
        {docxState === 'error'
          ? fallback('This Word file could not be shown here. Download it to open in Microsoft Word.')
          : <div ref={docxRef} className="docx-host" />}
      </div>
    )
  else if (kind === 'word')
    body = fallback('Old .doc files cannot be previewed in the browser. Download to open in Microsoft Word (tip: save as .docx for preview).')
  else body = fallback('Preview not available for this file type.')

  return (
    <div
      className={
        full
          ? 'fixed inset-0 z-[60] flex flex-col bg-slate-100'
          : 'flex h-[65vh] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100'
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2">
        <FileIcon name={version.file_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-800" title={version.file_name}>
              {version.file_name}
            </span>
            {isLatest ? (
              <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Latest</span>
            ) : (
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">Old version</span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            v{version.version} · {formatDate(version.created_at)} · {formatSize(version.file_size)}
          </div>
        </div>
        <div className="flex items-center">
          {kind === 'image' && (
            <>
              <ToolButton icon={I.zoomOut} title="Zoom out" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} />
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Reset zoom"
                className="w-12 cursor-pointer text-center text-xs text-slate-600 hover:text-slate-900"
              >
                {Math.round(zoom * 100)}%
              </button>
              <ToolButton icon={I.zoomIn} title="Zoom in" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))} />
              <ToolButton icon={I.rotate} title="Rotate" onClick={() => setRotate((r) => (r + 90) % 360)} />
              <span className="mx-1 h-5 w-px bg-slate-200" />
            </>
          )}
          {url && <ToolButton icon={I.external} title="Open in new tab" onClick={() => window.open(url, '_blank')} />}
          <ToolButton icon={I.download} title="Download" onClick={download} />
          <ToolButton icon={full ? I.shrink : I.expand} title={full ? 'Exit full screen (Esc)' : 'Full screen'} onClick={() => setFull(!full)} />
        </div>
      </div>

      <div className="min-h-0 flex-1">{body}</div>
    </div>
  )
}
