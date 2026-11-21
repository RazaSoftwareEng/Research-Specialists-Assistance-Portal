# Research Specialists Assistance for Original articles / Reviews and Clinical trials

A simple document review app: **React (Vite) + Tailwind CSS** on the front end, **Supabase** (Auth, Postgres, Storage) on the back end.

## How it works

1. **User** signs up, uploads a document (PDF, Word or image, max 20 MB). Status: *Pending review*.
2. **Admin** opens it, previews it, writes a note and clicks **Request changes**, **Approve** or **Reject**.
3. **User** sees *Changes requested*, reads the admin notes, and uploads a new version (v2, v3, …). Status goes back to *Pending review*.
4. Repeat until approved. All versions and notes are kept.

## Setup (about 5 minutes)

### 1. Create the Supabase project
1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**, paste all of [supabase/schema.sql](supabase/schema.sql) and click **Run**.
   This creates the tables, security rules (RLS) and the private `documents` storage bucket.
3. **Authentication → Sign In / Providers → Email**: turn **off** *Confirm email* and save.
   No confirmation email is sent; after sign-up the user goes straight to the dashboard.

### 2. Configure the app
```bash
cp .env.example .env
```
Fill in from **Project Settings → API**:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Run it
```bash
npm install
npm run dev
```
Open http://localhost:5173.

### 4. Make an admin
Sign up in the app with the admin's email, then run in the SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```
Sign out and back in; that account now sees the Admin dashboard. Everyone else is a normal user.

## Project structure
```
src/
  lib/supabase.js            Supabase client + upload/revision/delete helpers
  App.jsx                    Session handling, routes admin vs user
  pages/Auth.jsx             Sign in / sign up
  pages/UserDashboard.jsx    Upload, my documents, stats
  pages/AdminDashboard.jsx   All documents, filters, search
  components/DocumentModal.jsx  Preview, versions, notes, review / re-upload
supabase/schema.sql          Database, RLS policies, storage bucket
```

## Security notes
- Users can only see their own documents and files; admins see everything.
- Only admins can add notes or set Approved / Rejected / Changes requested (enforced in the database, not just the UI).
- Files are in a private bucket and opened through 1-hour signed URLs.

## Build for production
```bash
npm run build   # output in dist/ — deploy to Vercel, Netlify, etc. with the same two env vars
```
