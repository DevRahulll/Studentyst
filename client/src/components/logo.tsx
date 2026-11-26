import { Link } from "react-router-dom";

export const LogoMark = ({ className = "size-8" }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
        <rect x="7" y="17" width="4.5" height="8" rx="1.5" fill="#1a0e05" />
        <rect
            x="13.75"
            y="12"
            width="4.5"
            height="13"
            rx="1.5"
            fill="#1a0e05"
        />
        <rect x="20.5" y="7" width="4.5" height="18" rx="1.5" fill="#1a0e05" />
    </svg>
);

function Logo({ onClick }: { onClick?: () => void }) {
    return (
        <Link
            to="/"
            onClick={onClick}
            className="inline-flex items-center gap-2.5 rounded-md"
        >
            <LogoMark />
            <span className="font-display text-xl font-bold tracking-tight">
                Studentyst
            </span>
        </Link>
    );
}

export default Logo;
