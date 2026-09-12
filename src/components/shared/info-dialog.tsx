"use client";

import { useNativeDialog } from "@/hooks/use-native-dialog";

interface InfoDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
}

/** Read-only cartoon-styled modal - shares ConfirmDialog's native <dialog> pattern, minus the confirm/cancel choice. */
export default function InfoDialog({
  open,
  title,
  children,
  onClose,
  closeLabel = "Stäng",
}: InfoDialogProps): React.JSX.Element {
  const dialogRef = useNativeDialog(open);

  return (
    <dialog
      className="cartoon-card m-auto w-[90vw] max-w-md p-5 backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <p className="font-black text-black text-xl">{title}</p>
      <div className="mt-2 font-semibold text-gray-600 text-sm">{children}</div>
      <div className="mt-5 flex justify-end">
        <button className="cartoon-btn cartoon-btn-primary" onClick={onClose} type="button">
          {closeLabel}
        </button>
      </div>
    </dialog>
  );
}
