# Notification & Alert System Analysis

## 1. Executive Summary
The current frontend codebase (`Neuro-Frontend`) employs multiple, overlapping notification systems, leading to a fragmented user experience and maintainability challenges. We have identified five different toast/alert libraries and various inline messaging patterns.

**Objective:** Standardize on two primary systems:
1.  **Sonner**: For transient, non-blocking feedback (Success, Info, Loading).
2.  **SweetAlert2**: For critical alerts, confirmations, and blocking notifications.

---

## 2. Current State Assessment

### 2.1 Installed Libraries (package.json)
The project currently has a "notification library bloat" issue:
- `@radix-ui/react-toast` (Shadcn base)
- `sonner` (Modern, used in some components)
- `sweetalert2` (Used via `utils/sweetalert.ts`)
- `react-hot-toast` (Installed but seemingly unused)
- `react-toastify` (Installed but seemingly unused)

### 2.2 Usage Patterns

#### A. SweetAlert2 (`utils/sweetalert.ts`)
Used in:
- `WardenProfile.tsx` (for profile updates, password changes)
- `HodProfile.tsx` (similar patterns)
- *Pros*: Theme-aware (dark/light), consistent look for blocking alerts.
- *Cons*: Used for simple success messages where a non-blocking toast would be better.

#### B. Shadcn Toast (`hooks/use-toast.ts`)
Used in:
- `WardenIssueManagement.tsx`
- `HMS/StudentManagement.tsx`
- *Pros*: Integrated with the UI component library.
- *Cons*: Slightly more verbose than Sonner.

#### C. Inline Messages (State-based)
Used in:
- `WardenProfile.tsx`: `{error && <div className="text-red-500 text-center">{error}</div>}`
- `SubjectManagement.tsx`: `{state.error && ...}`
- `HodProfile.tsx`: `{error && ...}`
- *Pros*: Zero external dependencies.
- *Cons*: Inconsistent styling, requires manual state management in every component, takes up layout space.

---

## 3. Standardization Proposal

### 3.1 Decision Matrix

| Notification Type | Recommended Tool | Implementation |
| :--- | :--- | :--- |
| **Success/Save Feedback** | Sonner | `toast.success("Saved successfully")` |
| **Transient Errors** | Sonner | `toast.error("Failed to load data")` |
| **Blocking Alerts** | SweetAlert2 | `showErrorAlert("Critical", "...")` |
| **Confirmations** | SweetAlert2 | `Swal.fire({ ... showCancelButton: true })` |
| **Field Validation** | Inline | Custom `<FieldError />` component |
| **Global Form Errors** | Sonner | `toast.error("Please fix form errors")` |

### 3.2 Action Plan

1.  **Clean up Dependencies**:
    - Uninstall `react-hot-toast` and `react-toastify`.
    - Evaluate if `@radix-ui/react-toast` can be fully replaced by `sonner`.

2.  **Standardize Toast Provider**:
    - Ensure `Sonner` is the primary toaster in `App.tsx`.
    - Create a wrapper/hook if needed to ensure consistent theme styling.

3.  **Refactor Components**:
    - **Phase 1: Profiles**: Replace inline `{error && ...}` with Sonner toasts. Change blocking "Save Success" SweetAlerts to Sonner success toasts.
    - **Phase 2: Management Pages**: Audit `hod/`, `hms/`, and `superadmin/` folders to replace `useToast` (Shadcn) with `sonner` for consistency.
    - **Phase 3: Form Validations**: Ensure all `text-red-500` messages for validation are standardized using a shared `ErrorMessage` component.

4.  **Enhance `utils/sweetalert.ts`**:
    - Add a `confirm` helper to handle the common "Are you sure?" pattern with a Promise-based API.

---

## 4. Specific Component Audit (Examples)

### WardenProfile.tsx
- **Current**: Uses `showSuccessAlert` for "Profile saved successfully".
- **Fix**: Use `toast.success` from Sonner.
- **Current**: Inline `{error && ...}` at line 428.
- **Fix**: Remove state variable `error` and use `toast.error`.

### WardenIssueManagement.tsx
- **Current**: Uses `useToast` (Shadcn).
- **Fix**: Migrate to `sonner` to match the project direction.

### SubjectManagement.tsx / StudentManagement.tsx
- **Current**: Heavy use of inline red text for errors.
- **Fix**: Standardize on Sonner for action feedback and a shared `FormError` component for field-level issues.
