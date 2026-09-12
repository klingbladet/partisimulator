"use client";

import { useNativeDialog } from "@/hooks/use-native-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cartoon-styled replacement for window.confirm, backed by the native <dialog> element. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const dialogRef = useNativeDialog(open);

  return (
    <dialog
      className="cartoon-card m-auto w-[90vw] max-w-sm p-5 backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      ref={dialogRef}
    >
      <p className="font-black text-black text-xl">{title}</p>
      <p className="mt-2 font-semibold text-gray-600 text-sm">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="cartoon-btn cartoon-btn-ghost" onClick={onCancel} type="button">
          {cancelLabel}
        </button>
        <button className="cartoon-btn cartoon-btn-primary" onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
