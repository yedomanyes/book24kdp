# Book24 Supabase Account System Migration Plan

> For Hermes: migrate authentication and user-scoped persistence from Firebase to Supabase without changing the app's owner/admin behavior.

Goal: Replace Firebase Auth + Firestore with Supabase Auth + Postgres/RLS while preserving the current Book24 UX, local account switching, cloud books, brain state, queue, and owner-only admin visibility for yigitguener22@gmail.com.

Architecture:
- Supabase Auth becomes the single login source.
- Postgres tables replace Firestore collections; every row is scoped by user_id = auth.uid().
- The app keeps its existing local activeAccountId concept for workspace separation, but cloud rows store both user_id and account_id.
- Owner UI remains email-gated on the client for UX, but the real protection must come from server-side access rules / owner-only RPCs later.

Tech stack:
- @supabase/supabase-js
- Supabase Auth
- Postgres + RLS
- existing React + Vite frontend

Current Firebase mapping:
- users/{uid} -> profiles row
- users/{uid}/books/{bookId} -> books table
- users/{uid}/brain_states/{accountId} -> brain_states table
- users/{uid}/queue/{accountId}__{bookId} -> queue_items table
- users/{uid}/data/accounts -> accounts table

---

## Target data model

profiles
- id uuid primary key references auth.users(id) on delete cascade
- email text
- name text
- photo_url text
- email_verified boolean default false
- provider_ids jsonb default '[]'::jsonb
- status text default 'active'
- is_owner boolean default false
- created_at timestamptz default now()
- updated_at timestamptz default now()
- last_login_at timestamptz

accounts
- id text primary key
- user_id uuid not null references auth.users(id) on delete cascade
- username text not null
- created_at timestamptz default now()
- updated_at timestamptz default now()

books
- id text primary key
- user_id uuid not null references auth.users(id) on delete cascade
- account_id text not null
- payload jsonb not null
- title text
- market_niche text
- updated_at timestamptz default now()
- created_at timestamptz default now()

brain_states
- user_id uuid not null references auth.users(id) on delete cascade
- account_id text not null
- state jsonb not null
- updated_at timestamptz default now()
- primary key (user_id, account_id)

queue_items
- id text primary key
- user_id uuid not null references auth.users(id) on delete cascade
- account_id text not null
- book_id text not null
- title text
- niche text
- content jsonb not null
- quality_score numeric default 0
- synced_to_obsidian boolean default false
- updated_at timestamptz default now()
- created_at timestamptz default now()

Suggested unique/indexes:
- accounts unique (user_id, id)
- books index on (user_id, account_id)
- queue_items index on (user_id, account_id, synced_to_obsidian)

## RLS policy baseline

Enable RLS on every app table.

Basic policy shape for user-owned tables:
- select: auth.uid() = user_id
- insert: auth.uid() = user_id
- update: auth.uid() = user_id
- delete: auth.uid() = user_id

For profiles:
- user can read/update own row
- insert only when auth.uid() = id

Owner/admin note:
- Do not rely only on client email checks for real admin data access.
- Short-term: keep client owner gating for rendering the Owner tab.
- Real protection later: add owner-only server endpoint or RPC using service_role, checking email yigitguener22@gmail.com or is_owner=true in profiles.

---

## App behavior decisions

1. Login source
- Use Supabase Auth instead of Firebase Auth.
- Keep Google + Email/Password if desired.

2. Owner visibility
- Keep yigitguener22@gmail.com as the owner email.
- Existing src/lib/owner.ts logic can stay conceptually the same; replace currentUser.email source from Firebase user to Supabase session user.

3. Local account system
- Keep the existing app-level account switcher.
- activeAccountId stays in localStorage as now.
- Cloud persistence stores account_id on rows so each user can have multiple workspaces/profiles.

4. Cloud sync
- Continue syncing books, brain state, queue, accounts — only storage backend changes.

---

## Implementation tasks

### Task 1: Add Supabase client setup
Files:
- Create: src/supabase.ts
- Modify: package.json

Steps:
1. Install @supabase/supabase-js.
2. Create src/supabase.ts exporting supabase client and isSupabaseConfigured().
3. Read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from env.
4. Do not put secret/service_role keys in Vite client code.

Verification:
- npm run build passes

### Task 2: Replace Firebase auth state with Supabase auth state
Files:
- Modify: src/App.tsx
- Modify: src/components/Auth.tsx

Steps:
1. Replace Firebase onAuthStateChanged with supabase.auth.getSession + onAuthStateChange.
2. Replace signOut() with supabase.auth.signOut().
3. Update Auth.tsx to use:
   - signInWithPassword
   - signUp
   - signInWithOAuth({ provider: 'google' })
4. Remove Firebase setup assistant from login flow if Supabase env is present.

Verification:
- login modal works
- currentUser equivalent updates correctly

### Task 3: Create Supabase profile sync service
Files:
- Replace/rename: src/services/userProfileService.ts

Steps:
1. On login, upsert profiles row using auth user metadata.
2. Set is_owner = true when email is yigitguener22@gmail.com.
3. Update last_login_at and updated_at.

Verification:
- login creates/updates profiles row

### Task 4: Replace StorageService cloud methods
Files:
- Modify: src/services/StorageService.ts

Steps:
1. Replace Firebase doc/collection operations with Supabase table CRUD.
2. Keep localStorage behavior unchanged.
3. Map methods:
   - saveBookToCloud -> upsert books row
   - deleteBookFromCloud -> delete from books where id, user_id
   - loadBooksFromCloud -> select payload from books where user_id/account_id
   - saveAccountsToCloud -> upsert accounts rows
   - loadAccountsFromCloud -> select accounts for user
4. Preserve merge logic in App.tsx.

Verification:
- local/cloud merge still works after login

### Task 5: Replace brain state + queue backend
Files:
- Modify: src/services/brain/CloudQueueService.ts

Steps:
1. Replace Firestore queue calls with queue_items table operations.
2. Replace brain state push/pull with brain_states table.
3. Keep account_id filtering behavior exactly as now.

Verification:
- queue count and brain sync still update

### Task 6: Update Firebase status box to Supabase status box
Files:
- Rename/replace: src/components/FirebaseStatusBox.tsx
- Modify: src/components/BrainDashboard.tsx

Steps:
1. Rename UI copy to Supabase Live Status.
2. Probe Supabase auth + table reads instead of Firestore.
3. Keep metrics: current user, cloud books, brain state found, queue status.

Verification:
- Brain dashboard shows Supabase-backed live status

### Task 7: Keep owner gating for yigit email
Files:
- Modify if needed: src/lib/owner.ts
- Modify if needed: src/components/OwnerPanel.tsx

Steps:
1. Keep fallback owner email yigitguener22@gmail.com.
2. Ensure OwnerPanel reads Supabase session user email.
3. Do not expose privileged global user listing from client-only anon queries.
4. If owner user directory must remain global, move it to secure backend/RPC later.

Important:
- A purely client-side app with anon key and RLS cannot safely let one normal logged-in user browse all users unless you intentionally create a privileged path.
- Therefore, short-term owner UI can remain visible, but any true cross-user admin data needs a server function or RPC guarded by service_role.

### Task 8: Remove Firebase dependencies only after Supabase path is stable
Files:
- Modify: package.json
- Remove later: src/firebase.ts
- Clean imports across src/

Steps:
1. Build and verify Supabase path first.
2. Then remove firebase / firebase-admin dependencies.
3. Delete dead code and Firebase-only setup text.

Verification:
- npm run build passes with no Firebase imports left

---

## Security rules for the keys already generated

Frontend/Vite client may use only:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY or publishable/anon equivalent

Never put in client code:
- secret key
- service_role key

If a secret or service_role key was pasted into chat or stored in a frontend file, rotate it in Supabase immediately and do not reuse it.

---

## Recommended env layout

Frontend (.env.local)
- VITE_SUPABASE_URL=...
- VITE_SUPABASE_ANON_KEY=...
- VITE_OWNER_EMAIL=yigitguener22@gmail.com

Backend only (later, if owner admin API is added)
- SUPABASE_SERVICE_ROLE_KEY=...

---

## Immediate recommendation

Do the migration in this order:
1. Supabase client + auth
2. profiles/accounts/books
3. brain_states/queue_items
4. status box rename
5. owner/admin hardening
6. remove Firebase

This preserves momentum and keeps the owner email behavior intact.
