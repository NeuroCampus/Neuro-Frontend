# Project Todo List - Notification Standardization & Health Check

This list tracks the remaining tasks for standardizing the notification system and ensuring codebase health.

## High Priority: Syntax & Critical Fixes
- [x] Fix syntax error in `HODStats.tsx` (missing catch block)
- [x] Fix ReferenceError in `HODStats.tsx` (missing Button import)
- [x] Fix ReferenceError in `AnnouncementManagement.tsx` (remaining MySwal usage)

## Medium Priority: Notification Migration (Ref: NOTIFICATION_MIGRATION_PLAN.md)
- [ ] Audit all components for remaining `window.confirm` calls.
- [ ] Replace `useToast` (Shadcn default) with `sonner` in all HMS components.
- [ ] Replace `useToast` in all Warden components.
- [ ] Ensure all destructive actions (Delete) use `showConfirmAlert`.
- [ ] Remove `sweetalert2` from `package.json` once migration is verified.
- [ ] Delete legacy utility `src/utils/sweetalert.ts`.

## Low Priority: Cleanup & Optimization
- [ ] Remove excessive "Debug log" `console.log` calls in `src/utils/student_api.ts`.
- [ ] Standardize `console.debug` usage across the project (use a shared logger if possible).
- [ ] Audit CSS files for obsolete `.swal2-*` classes (e.g., in `DeanFacultyProfile.tsx`).

## Verification Checklist
- [x] Type check passes (`npx tsc --noEmit`)
- [ ] Build passes (`npm run build`)
- [ ] Mobile popup widths verified (88vw)
