# Notification System Migration Plan

This plan outlines the steps to fully migrate the Neuro codebase to the standardized notification system using **Sonner** and **Radix UI AlertDialog**.

## Phase 1: Identification & Auditing

Execute the following searches to find legacy notification usage:

- **SweetAlert2**: `grep -r "sweetalert2" src/` or `grep -r "Swal" src/`
- **Native Confirmations**: `grep -r "window.confirm" src/`
- **Other Toast Libraries**: `grep -r "react-hot-toast" src/`, `grep -r "react-toastify" src/`
- **Shadcn Default Toast**: `grep -r "useToast" src/`

---

## Phase 2: Refactoring Patterns

### 1. Simple Feedback (Success/Error)
**Legacy (Delete/Replace):**
- `Swal.fire({ icon: 'success', ... })`
- `toast.success(...)` (from hot-toast/toastify)
- `useToast().toast(...)`

**New Standard:**
```tsx
import { toast } from "sonner";
toast.success("Message", { description: "..." });
```

### 2. Confirmations (Are you sure?)
**Legacy (Delete/Replace):**
- `if (window.confirm("...")) { ... }`
- `Swal.fire({ ..., showCancelButton: true }).then((result) => { if (result.isConfirmed) { ... } })`

**New Standard:**
```tsx
import { showConfirmAlert } from "@/utils/showConfirmAlert";

const confirmed = await showConfirmAlert("Title", "Message");
if (confirmed.isConfirmed) {
  // Action
}
```

---

## Phase 3: Cleanup & Removal

1.  **Remove Imports**: Delete all imports of `sweetalert2`, `react-hot-toast`, etc.
2.  **Uninstall Packages**:
    ```bash
    npm uninstall sweetalert2 sweetalert2-react-content react-hot-toast react-toastify
    ```
3.  **Delete Legacy Utils**: Remove `src/utils/sweetalert.ts`.

---

## Phase 4: Verification

Test the following key areas after migration:
- [ ] Admin Announcement Management (Create/Delete)
- [ ] HMS Hostel/Room Management (Delete)
- [ ] Faculty Marks/QP Upload (Success feedback)
- [ ] HOD/COE Approval Workflows (Confirmation dialogs)
- [ ] All Profile pages (Save feedback, Password change)
