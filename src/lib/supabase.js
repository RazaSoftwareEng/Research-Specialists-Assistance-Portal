import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Accepts either the new "publishable" key or the legacy "anon" key
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT'))
// "Remember me": checked -> session kept in localStorage (stays logged in after closing the browser)
// unchecked -> sessionStorage (logged out when the browser is closed)
const REMEMBER_KEY = 'df_remember'
export const getRemember = () => {
  try { return localStorage.getItem(REMEMBER_KEY) !== '0' } catch { return true }
}
export const setRemember = (on) => {
  try { localStorage.setItem(REMEMBER_KEY, on ? '1' : '0') } catch {}
}
const authStorage = {
  getItem: (k) => {
    try { return localStorage.getItem(k) ?? sessionStorage.getItem(k) } catch { return null }
  },
  setItem: (k, v) => {
    try {
      const [keep, drop] = getRemember() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
      keep.setItem(k, v)
      drop.removeItem(k)
    } catch {}
  },
  removeItem: (k) => {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch {}
  },
}

export const supabase = isConfigured
  ? createClient(url, key, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true } })
  : null

export const BUCKET = 'documents'
export const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
export const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp'
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp']

export const STATUS = {
  pending: { label: 'Pending review', cls: 'bg-amber-100 text-amber-800' },
  needs_changes: { label: 'Changes requested', cls: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-800' },
}

export const CATEGORIES = {
  original_article: { label: 'Original article', cls: 'bg-violet-100 text-violet-700' },
  review: { label: 'Review', cls: 'bg-sky-100 text-sky-700' },
  clinical_trial: { label: 'Clinical trial', cls: 'bg-teal-100 text-teal-700' },
  other: { label: 'Other', cls: 'bg-slate-100 text-slate-600' },
}

export function fileKind(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image'
  return 'other'
}

export function validateFile(file) {
  if (!file) return 'Please choose a file.'
  const ext = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) return 'Only PDF, Word (.doc/.docx) and image files are allowed.'
  if (file.size > MAX_SIZE) return 'File is too large (max 20 MB).'
  return null
}

export function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const formatDate = (d) =>
  new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// Files live in the OWNER's folder: {ownerId}/{docId}/v{n}-...
async function uploadVersion({ ownerId, uploaderId, docId, version, file }) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${ownerId}/${docId}/v${version}-${Date.now()}-${safe}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  })
  if (upErr) throw upErr
  const { error } = await supabase.from('document_versions').insert({
    document_id: docId,
    version,
    file_path: path,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: uploaderId,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
}

/** Create a new document with its first file (v1). Admin may pass another ownerId. */
export async function createDocument({ ownerId, uploaderId, title, description, category, file }) {
  const { data: doc, error } = await supabase
    .from('documents')
    .insert({ user_id: ownerId, title, description, category })
    .select()
    .single()
  if (error) throw error
  try {
    await uploadVersion({ ownerId, uploaderId: uploaderId ?? ownerId, docId: doc.id, version: 1, file })
  } catch (e) {
    await supabase.from('documents').delete().eq('id', doc.id)
    throw e
  }
  return doc
}

/** Upload a revised file -> new version, status back to pending. */
export async function uploadRevision(doc, uploaderId, file) {
  const next = doc.current_version + 1
  await uploadVersion({ ownerId: doc.user_id, uploaderId, docId: doc.id, version: next, file })
  const { error } = await supabase
    .from('documents')
    .update({ current_version: next, status: 'pending' })
    .eq('id', doc.id)
  if (error) throw error
}

/** Admin: delete one (non-latest) version and its file. */
export async function deleteVersion(version) {
  await supabase.storage.from(BUCKET).remove([version.file_path])
  const { error } = await supabase.from('document_versions').delete().eq('id', version.id)
  if (error) throw error
}

/** Delete a document and all of its stored files. */
export async function deleteDocument(docId) {
  const { data: versions } = await supabase
    .from('document_versions')
    .select('file_path')
    .eq('document_id', docId)
  if (versions?.length) await supabase.storage.from(BUCKET).remove(versions.map((v) => v.file_path))
  const { error } = await supabase.from('documents').delete().eq('id', docId)
  if (error) throw error
}

export async function signedUrl(path, download = false) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60, download ? { download: true } : undefined)
  if (error) throw error
  return data.signedUrl
}

/** Admin: create a user account without logging the admin out. */
export async function adminCreateUser({ email, password, fullName, phone, institution, role }) {
  const temp = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'rsa-admin-create' },
  })
  const { data, error } = await temp.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, institution } },
  })
  if (error) throw error
  if (!data.user || data.user.identities?.length === 0) throw new Error('A user with this email already exists.')
  await temp.auth.signOut().catch(() => {})
  if (role === 'admin') {
    const { error: e2 } = await supabase.from('profiles').update({ role }).eq('id', data.user.id)
    if (e2) throw e2
  }
  return data.user
}

/** Admin: delete a user, their files and all their documents. */
export async function adminDeleteUser(userId) {
  const { data: docs } = await supabase.from('documents').select('id').eq('user_id', userId)
  if (docs?.length) {
    const { data: versions } = await supabase
      .from('document_versions')
      .select('file_path')
      .in('document_id', docs.map((d) => d.id))
    if (versions?.length) await supabase.storage.from(BUCKET).remove(versions.map((v) => v.file_path))
  }
  const { error } = await supabase.rpc('admin_delete_user', { target: userId })
  if (error) throw error
}
