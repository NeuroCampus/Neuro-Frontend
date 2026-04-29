import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Standardized promise-based confirmation dialog using Radix UI / Shadcn.
 * Replaces legacy SweetAlert2 and blocking window.confirm.
 * 
 * Usage:
 * const result = await showConfirmAlert("Are you sure?", "This action cannot be undone.");
 * if (result.isConfirmed) { ... }
 */
export const showConfirmAlert = (
  title: string, 
  text: string, 
  confirmButtonText: string = 'Yes', 
  cancelButtonText: string = 'Cancel'
): Promise<{ isConfirmed: boolean }> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.id = 'confirm-alert-container';
    document.body.appendChild(container);
    
    const root = createRoot(container);

    const cleanup = (confirmed: boolean) => {
      // Small delay to allow animations to finish if any
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 300);
      resolve({ isConfirmed: confirmed });
    };

    root.render(
      <AlertDialog defaultOpen={true} onOpenChange={(open) => { if (!open) cleanup(false); }}>
        <AlertDialogContent onEscapeKeyDown={() => cleanup(false)} onPointerDownOutside={() => cleanup(false)}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => cleanup(false)}>{cancelButtonText}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cleanup(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {confirmButtonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  });
};
