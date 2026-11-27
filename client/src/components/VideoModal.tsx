import { XIcon } from "lucide-react";
import { useModal } from "../hooks/useModal";

interface VideoModalProps {
    open: boolean;
    title: string;
    src: string;
    onClose: () => void;
}

// plays a free-preview lecture without leaving the course page
function VideoModal({ open, title, src, onClose }: VideoModalProps) {
    useModal(open, onClose);
    if (!open) return null;
    return (
        <div
            className="modal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                role="dialog"
                className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface"
            >
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-accent">
                            Free preview
                        </p>
                        <h2 className="truncate text-base font-semibold">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-ghost size-9 shrink-0 p-0!"
                    >
                        <XIcon className="size-5" />
                    </button>
                </div>
                <video
                    key={src}
                    src={src}
                    controls
                    autoPlay
                    playsInline
                    className="aspect-video w-full bg-black"
                />
            </div>
        </div>
    );
}

export default VideoModal;
