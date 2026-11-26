import { useState } from "react";
import { ImageOffIcon } from "lucide-react";

interface ThumbProps {
    src?: string;
    alt: string;
    className?: string;
    eager?: boolean;
}

/** Course image with a quiet fallback if the URL is missing or broken. */
function Thumb({ src, alt, className = "", eager = false }: ThumbProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const failed = failedSrc === src;

    if (!src || failed) {
        return (
            <div
                className={`grid place-items-center bg-raised text-faint ${className}`}
                role="img"
                aria-label={alt}
            >
                <ImageOffIcon className="size-7" strokeWidth={1.5} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            onError={() => setFailedSrc(src ?? null)}
            className={`bg-raised object-cover ${className}`}
        />
    );
}

export default Thumb;
