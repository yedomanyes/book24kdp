---
type: "code-context-section"
id: "storage-cloud"
title: "Storage, Supabase & Cloud"
updatedAt: "2026-07-03T17:03:33.095Z"
---

# Storage, Supabase & Cloud

Lokale Persistenz, Supabase-Verbindung, Cloud-Sync und Backend-Definitionen.

- Dateien: 12
- Gesamtzeilen: 1182

## Wichtige Symbole
- saveLibrarySnapshot
- loadLibrarySnapshot
- loadAllLibrarySnapshots
- deleteLibrarySnapshot
- migrateOldKeys
- createBackup
- downloadBackup
- importBackup
- isSupabaseConfigured
- supabase
- toAppUser
- getCurrentAppUser
- AppUser
- searchNicheAPI

## Top Dateien
- src/services/StorageService.ts — 489 Zeilen | Symbole: saveLibrarySnapshot, loadLibrarySnapshot, loadAllLibrarySnapshots, deleteLibrarySnapshot, migrateOldKeys, createBackup, downloadBackup, importBackup
- src/supabase.ts — 140 Zeilen | Symbole: isSupabaseConfigured, supabase, toAppUser, getCurrentAppUser, AppUser
- supabase/book24_schema.sql — 101 Zeilen
- supabase/fix_owner_dashboard_stats.sql — 74 Zeilen
- supabase/bug_reports.sql — 69 Zeilen
- supabase/activity_logs.sql — 66 Zeilen
- supabase/admin_get_all_books_stats.sql — 58 Zeilen
- functions/src/index.ts — 53 Zeilen | Symbole: searchNicheAPI

## Vollständige Dateiübersicht
- functions/src/index.d.ts (21)
- functions/src/index.js (44) | searchNicheAPI
- functions/src/index.ts (53) | searchNicheAPI
- src/services/StorageService.ts (489) | saveLibrarySnapshot, loadLibrarySnapshot, loadAllLibrarySnapshots, deleteLibrarySnapshot, migrateOldKeys, createBackup, downloadBackup, importBackup
- src/supabase.ts (140) | isSupabaseConfigured, supabase, toAppUser, getCurrentAppUser, AppUser
- supabase/activate_license_for_user.sql (33)
- supabase/activity_logs.sql (66)
- supabase/admin_get_all_books_stats.sql (58)
- supabase/auto_claim_license_by_email.sql (34)
- supabase/book24_schema.sql (101)
- supabase/bug_reports.sql (69)
- supabase/fix_owner_dashboard_stats.sql (74)
