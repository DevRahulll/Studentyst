import { useModal } from "../hooks/useModal";
import { Spinner } from "./ui";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useModal(open, onCancel);
    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
        >
            <div role="alertdialog" className="modal-card max-w-sm">
                <h2 id="confirm-title" className="text-xl font-semibold">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-muted">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="btn-ghost"
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="" disabled={busy}>
                        {busy && <Spinner className="size-4" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
