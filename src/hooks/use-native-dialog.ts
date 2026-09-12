import { type RefObject, useEffect, useRef } from "react";

/** Wires a native <dialog> element's open/close state to a boolean prop, shared by ConfirmDialog and InfoDialog. */
export function useNativeDialog(open: boolean): RefObject<HTMLDialogElement | null> {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return dialogRef;
}
