# Notification & Confirmation Standards

This document outlines the standardized approach for providing UI feedback and requesting user confirmations within the Neuro codebase. All new pages and modifications to existing pages MUST adhere to these standards.

## 1. Toasts (Non-blocking Notifications)

We use `sonner` for all non-blocking notifications (success, error, info).

### Standard Usage
```tsx
import { toast } from "sonner";

// Success notification
toast.success("Success Message", {
  description: "Detailed description of what happened."
});

// Error notification
toast.error("Error Message", {
  description: "Explanation of why it failed."
});

// Info notification
toast.info("Information", {
  description: "Contextual information for the user."
});
```

### Prohibited Libraries
- `SweetAlert2` (Swal)
- `react-hot-toast`
- `react-toastify`
- Browser defaults (`alert`)

---

## 2. Confirmations (Blocking Dialogs)

We use a custom, promise-based utility `showConfirmAlert` built on Radix UI `AlertDialog`.

### Standard Usage
```tsx
import { showConfirmAlert } from "@/utils/showConfirmAlert";

const handleDelete = async (id: number) => {
  const result = await showConfirmAlert(
    "Are you sure?", 
    "This action cannot be undone. Data will be permanently removed.",
    "Yes, delete it", // Optional: Confirm button text
    "Cancel"         // Optional: Cancel button text
  );

  if (result.isConfirmed) {
    // Proceed with deletion
    console.log("Deleted item:", id);
  }
};
```

### Prohibited Methods
- `window.confirm()`
- `Swal.fire()` with `showCancelButton: true`

---

## 3. Mobile Design & Aesthetics

### Popup Widths
Popups (Dialogs and Alert Dialogs) are configured to have a width of **88vw** on mobile devices to ensure they don't touch the screen edges and maintain a premium feel.

- **Base Components**: These widths are managed in `src/components/ui/dialog.tsx` and `src/components/ui/alert-dialog.tsx`.
- **Custom Modals**: If creating a custom modal with CSS, use `width: 88vw !important;` for mobile media queries.

### Visual Style
- **Glassmorphism**: Use subtle background blurs and semi-transparent backgrounds where appropriate.
- **Animations**: Leverage Framer Motion or Radix's built-in animations for smooth entry/exit.
- **Borders**: Use consistent `rounded-xl` or `rounded-2xl` for modals.

---

## 4. Compliance Checklist
- [ ] No `sweetalert2` imports remain in the file.
- [ ] `sonner` is used for all toasts.
- [ ] `showConfirmAlert` is used for all destructive actions.
- [ ] No `window.confirm` or `alert` calls.
- [ ] Modals use `88vw` width on mobile screens (automatic if using base components).
