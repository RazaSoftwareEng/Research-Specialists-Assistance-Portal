import { useRef, useState } from 'react'
import { ACCEPT, formatSize } from '../lib/supabase'
import { FileIcon } from './ui'

/** Click-or-drop file picker that shows the chosen file. */
export default function FileDrop({ file, onChange, compact }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  const pick = (f) => {
    onChange(f || null)
    if (ref.current) ref.current.value = ''
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
        <FileIcon name={file.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-800">{file.name}</div>
          <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
        </div>
        <button type="button" className="cursor-pointer text-xs font-medium text-indigo-700 hover:underline" onClick={() => ref.current.click()}>
          Change
        </button>
        <button type="button" className="cursor-pointer px-1 text-lg leading-none text-slate-400 hover:text-rose-600" title="Remove" onClick={() => pick(null)}>
          ×
        </button>
        <input ref={ref} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files[0])} />
      </div>
    )
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition ${
        compact ? 'p-4' : 'p-6'
      } ${drag ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        pick(e.dataTransfer.files[0])
      }}
    >
      <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      <span className="text-sm font-medium text-slate-700">{drag ? 'Drop it here' : 'Click to choose or drag a file here'}</span>
      <span className="mt-1 text-xs text-slate-500">PDF, Word or image · max 20 MB</span>
      <input ref={ref} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files[0])} />
    </label>
  )
}
